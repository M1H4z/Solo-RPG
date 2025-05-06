import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

// Tell Next.js not to cache this route
export const dynamic = 'force-dynamic';

// Type for active gate data
type ActiveGate = Database['public']['Tables']['active_gates']['Row'];

interface RouteParams {
  params: { gateId: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { gateId } = params;

    // 1. Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate gateId
    if (!gateId) {
        return NextResponse.json({ error: 'Missing gateId parameter' }, { status: 400 });
    }

    try {
        // 3. Fetch the current active gate, ensuring ownership
        const { data: currentGate, error: fetchError } = await supabase
            .from('active_gates')
            .select('*, hunters(user_id), current_room_status')
            .eq('id', gateId)
            .maybeSingle<ActiveGate & { hunters: { user_id: string } | null, current_room_status: string | null }>();

        if (fetchError) {
            console.error('Error fetching gate for progress:', fetchError);
            throw new Error('Failed to retrieve gate details.');
        }

        if (!currentGate) {
            return NextResponse.json({ error: 'Active gate not found.' }, { status: 404 });
        }

        // Authorization Check
        if (!currentGate.hunters || currentGate.hunters.user_id !== userId) {
            console.warn(`Unauthorized progress attempt on gate ${gateId} by user ${userId}`);
            return NextResponse.json({ error: 'Forbidden: You cannot modify this gate.' }, { status: 403 });
        }
        
        // Check expiry (redundant if GET already checked, but good practice)
        if (new Date(currentGate.expires_at) < new Date()) {
            return NextResponse.json({ error: 'This gate has expired.' }, { status: 410 });
        }

        // ---> ADDED CHECK: Ensure the current room is marked as cleared
        // This assumes another process (e.g., after combat victory) updates this status.
        if (currentGate.current_room_status !== 'cleared') {
             console.warn(`Attempt to progress gate ${gateId} from room ${currentGate.current_depth}-${currentGate.current_room} without clearing. Status: ${currentGate.current_room_status}`);
            return NextResponse.json({ error: 'Current room must be cleared before progressing.' }, { status: 400 }); // Bad Request or 403 Forbidden could also fit
        }
        // <--- END ADDED CHECK

        // 4. Calculate next room/depth
        let nextRoom = currentGate.current_room + 1;
        let nextDepth = currentGate.current_depth;
        const roomsThisDepth = currentGate.rooms_per_depth[currentGate.current_depth - 1];

        if (nextRoom > roomsThisDepth) {
            // Move to the next depth
            nextDepth += 1;
            if (nextDepth > currentGate.total_depth) {
                // Dungeon Cleared!
                // TODO: Implement dungeon clear logic (delete gate, give rewards?)
                console.log(`Dungeon Cleared: Gate ${gateId}`);
                // For now, just prevent further progress and maybe delete the gate
                await supabase.from('active_gates').delete().eq('id', gateId);
                return NextResponse.json({ message: 'Dungeon Cleared!', status: 'cleared' }, { status: 200 });
            }
            // Start at room 1 of the new depth
            nextRoom = 1; 
        }

        // 5. Update the gate in the database
        const { data: updatedGate, error: updateError } = await supabase
            .from('active_gates')
            .update({ 
                current_room: nextRoom,
                current_depth: nextDepth,
                current_room_status: 'pending'
            })
            .eq('id', gateId)
            .select() // Return the updated row
            .single(); // Expect exactly one row updated

        if (updateError) {
            console.error('Error updating gate progress:', updateError);
            throw new Error('Failed to update gate progress in database.');
        }

        // 6. Return success response with updated gate data (optional)
        return NextResponse.json({ 
            message: 'Progress updated successfully.', 
            activeGate: updatedGate as ActiveGate, 
            status: 'progressed'
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Error updating gate progress:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gate progress request' }, { status: 500 });
    }
} 