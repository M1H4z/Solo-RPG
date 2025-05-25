import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';

// Zod schema for input validation
const locateGateSchema = z.object({
    hunterId: z.string().uuid(),
    // Maybe add required resources later (e.g., keys, energy)
});

// Helper function to generate random integer in a range
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Example lists of gate types per rank
const GATE_TYPES: { [key: string]: string[] } = {
    E: ["Goblin Dungeon", "Undead Dungeon", "Humanoid Dungeon", "Slime Cave"],
    D: ["Orc Encampment", "Lizardman Lair", "Giant Spider Nest"],
    // Add more for C, B, A, S ranks
};

// Define necessary RLS policy for INSERT on active_gates
// Example Policy (needs to be added via migration or dashboard):
/*
CREATE POLICY "Allow owner INSERT" ON public.active_gates
    FOR INSERT
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = active_gates.hunter_id));
*/

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate Input
    let inputData;
    try {
        const rawData = await request.json();
        inputData = locateGateSchema.parse(rawData);
    } catch (error) {
        console.error("Invalid locate gate input:", error);
        return NextResponse.json({ error: 'Invalid input data', details: error }, { status: 400 });
    }
    const { hunterId } = inputData;

    try {
        // 3. Fetch Hunter Details & Authorize
        const { data: hunter, error: hunterError } = await supabase
            .from('hunters')
            .select('id, user_id, rank') // Select only needed fields
            .eq('id', hunterId)
            .single();

        if (hunterError) throw new Error('Hunter not found.');
        if (!hunter || hunter.user_id !== userId) throw new Error('Unauthorized access to hunter.');

        // 4. Check if hunter already has an active gate and clean up expired ones
        const { data: existingGate, error: checkError } = await supabase
            .from('active_gates')
            .select('id, expires_at')
            .eq('hunter_id', hunterId)
            .maybeSingle();

        if (checkError) throw new Error('Failed to check existing gates.');
        
        if (existingGate) {
            // Check if the existing gate is expired
            if (new Date(existingGate.expires_at) < new Date()) {
                console.log(`Found expired gate for hunter ${hunterId}, ID: ${existingGate.id}. Cleaning up before creating new gate...`);
                
                // Delete the expired gate
                const { error: deleteError } = await supabase
                    .from('active_gates')
                    .delete()
                    .eq('id', existingGate.id);
                
                if (deleteError) {
                    console.error('Error deleting expired gate:', deleteError);
                    throw new Error('Failed to clean up expired gate.');
                } else {
                    console.log(`Successfully cleaned up expired gate ${existingGate.id}`);
                }
                
                // Continue with gate creation since the expired gate has been removed
            } else {
                // Gate is still active, cannot create a new one
                return NextResponse.json({ error: 'Hunter already has an active gate.' }, { status: 409 }); // 409 Conflict
            }
        }

        // 5. TODO: Check Resources (Energy/Keys?) - Add later if needed

        // 6. Generate Gate Parameters
        const hunterRank = hunter.rank || 'E'; // Default to E if null
        const possibleGateTypes = GATE_TYPES[hunterRank] || GATE_TYPES['E']; // Fallback to E
        const gateType = possibleGateTypes[Math.floor(Math.random() * possibleGateTypes.length)];
        const gateRank = hunterRank;
        const totalDepth = getRandomInt(3, 6);
        const roomsPerDepth: number[] = [];
        for (let i = 0; i < totalDepth; i++) {
            roomsPerDepth.push(getRandomInt(3, 6));
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2); // Gate expires in 2 hours

        // 7. Insert into active_gates table
        const { data: newGate, error: insertError } = await supabase
            .from('active_gates')
            .insert({
                hunter_id: hunterId,
                gate_type: gateType,
                gate_rank: gateRank,
                total_depth: totalDepth,
                rooms_per_depth: roomsPerDepth,
                expires_at: expiresAt.toISOString(),
                // current_depth, current_room, created_at, updated_at have defaults
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error inserting active gate:", insertError);
            // Check if it's an RLS error or other constraint violation
            if (insertError.code === '42501') { // RLS violation
                 throw new Error('Database security policy prevented gate creation.');
            }
            throw new Error('Failed to create new gate in database.');
        }

        // 8. Return the newly created gate info
        return NextResponse.json({ activeGate: newGate }, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error('API Error locating gate:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gate location request' }, { status: 500 });
    }
} 