import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

// Tell Next.js not to cache this route
export const dynamic = 'force-dynamic';

// Type for active gate data (optional, but good practice)
type ActiveGate = Database['public']['Tables']['active_gates']['Row'];

interface RouteParams {
  params: { gateId: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { gateId } = params;

    // 1. Get User Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Validate gateId
    if (!gateId) {
        return NextResponse.json({ error: 'Missing gateId parameter' }, { status: 400 });
    }

    try {
        // 3. Fetch the current active gate to verify ownership before updating
        // We only need the hunter's user_id for the check here
        const { data: gateOwnerCheck, error: fetchOwnerError } = await supabase
            .from('active_gates')
            .select('hunter_id, hunters(user_id)') // Select hunter_id and join to get user_id
            .eq('id', gateId)
            .maybeSingle<{ hunter_id: string; hunters: { user_id: string } | null }>(); // Type for the select

        if (fetchOwnerError) {
            console.error('Error fetching gate owner for clear-room:', fetchOwnerError);
            throw new Error('Failed to verify gate ownership.');
        }

        if (!gateOwnerCheck) {
            return NextResponse.json({ error: 'Active gate not found.' }, { status: 404 });
        }

        // Authorization Check
        if (!gateOwnerCheck.hunters || gateOwnerCheck.hunters.user_id !== userId) {
            console.warn(`Unauthorized clear-room attempt on gate ${gateId} by user ${userId}`);
            return NextResponse.json({ error: 'Forbidden: You cannot modify this gate.' }, { status: 403 });
        }

        // 4. Update the gate status in the database
        const { error: updateError } = await supabase
            .from('active_gates')
            .update({ 
                current_room_status: 'cleared' // Set the status to cleared
            })
            .eq('id', gateId)
            // Match the hunter_id as an extra safety measure, ensuring the correct user owns the gate
            .eq('hunter_id', gateOwnerCheck.hunter_id); 

        if (updateError) {
            console.error('Error updating gate status to cleared:', updateError);
            throw new Error('Failed to update gate status in database.');
        }

        // 5. Return success response
        return NextResponse.json({ 
            message: 'Room status updated to cleared successfully.'
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Error updating gate room status:', error);
        return NextResponse.json({ error: error.message || 'Failed to process clear room request' }, { status: 500 });
    }
} 