import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';
import { calculateMaxMP } from '@/lib/game/stats'; // Import for potential fallback

// Constants for MP Recovery Calculation
const BASE_RECOVERY_PERCENT = 0.15;
const INT_SCALING_FACTOR = 0.002; // 0.2% per INT
const MAX_RECOVERY_PERCENT = 0.5; // 50% Cap

export async function POST(
    request: Request, // Method is POST, but we don't need a body, just hunterId
    { params }: { params: { hunterId: string } }
) {
    const supabase = createSupabaseServerClient();
    const user = await getAuthenticatedUser();
    const { hunterId } = params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    try {
        // 1. Fetch necessary hunter data
        const { data: hunterData, error: fetchError } = await supabase
            .from('hunters')
            .select('intelligence, level, current_mp')
            .eq('id', hunterId)
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // Code for 'Not found'
                 return NextResponse.json({ error: 'Hunter not found or access denied.' }, { status: 404 });
            }
            console.error(`Error fetching hunter for MP recovery ${hunterId}:`, fetchError);
            throw new Error(`Database error fetching hunter: ${fetchError.message}`);
        }
        
        // 2. Calculate recovery
        const intelligence = hunterData.intelligence ?? 0;
        const level = hunterData.level ?? 1; // Get level, default to 1 if null
        const maxMp = calculateMaxMP(intelligence, level); 
        const currentMp = hunterData.current_mp ?? maxMp; // Use underscore, default to calculated max if null

        const intScaling = intelligence * INT_SCALING_FACTOR;
        const totalRecoveryPercent = Math.min(
            BASE_RECOVERY_PERCENT + intScaling,
            MAX_RECOVERY_PERCENT
        );
        const recoveredMP = Math.floor(maxMp * totalRecoveryPercent);
        const newCurrentMP = Math.min(currentMp + recoveredMP, maxMp);
        const actualRecovered = newCurrentMP - currentMp;

        console.log(`[MP Recovery ${hunterId}] INT: ${intelligence}, Level: ${level}, MaxMP: ${maxMp}, CurrentMP: ${currentMp}, Recovery%: ${totalRecoveryPercent.toFixed(3)}, RawRecovered: ${recoveredMP}, NewMP: ${newCurrentMP}, ActualRecovered: ${actualRecovered}`);

        // 3. Update hunter if MP actually changed
        if (actualRecovered > 0) {
            const { error: updateError } = await supabase
                .from('hunters')
                .update({ current_mp: newCurrentMP }) // Use underscore
                .eq('id', hunterId); // No need for user_id check again, already validated

            if (updateError) {
                 console.error(`Error updating hunter MP recovery for ${hunterId}:`, updateError);
                 throw new Error(`Database error updating MP: ${updateError.message}`);
            }
             return NextResponse.json({ 
                message: `Recovered ${actualRecovered} MP.`, 
                recoveredAmount: actualRecovered,
                newCurrentMp: newCurrentMP
             });
        } else {
             // No recovery needed (already full or 0 recovery calculated)
             return NextResponse.json({ 
                message: 'MP already full or no recovery needed.', 
                recoveredAmount: 0,
                newCurrentMp: currentMp
             });
        }

    } catch (error: any) {
        console.error('[API /recover-mp] Unexpected error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 