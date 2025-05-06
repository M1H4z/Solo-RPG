import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService'; // Import the new function

export async function PATCH(
    request: Request,
    { params }: { params: { hunterId: string } }
) {
    const supabase = createSupabaseServerClient();
    const user = await getAuthenticatedUser(); // Call new function
    const { hunterId } = params;

    if (!user) { // Check for user object
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id; // Use user.id

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { currentHp, currentMp } = requestBody; // Allow updating both, though only HP is sent initially

    // --- Basic Input Validation ---
    const updates: { current_hp?: number; current_mp?: number } = {};
    let hasValidUpdate = false;

    if (typeof currentHp === 'number' && Number.isInteger(currentHp) && currentHp >= 0) {
        updates.current_hp = currentHp;
        hasValidUpdate = true;
    } else if (currentHp !== undefined) {
        // If currentHp is provided but invalid
        return NextResponse.json({ error: 'Invalid currentHp value. Must be a non-negative integer.' }, { status: 400 });
    }

    if (typeof currentMp === 'number' && Number.isInteger(currentMp) && currentMp >= 0) {
        updates.current_mp = currentMp;
        hasValidUpdate = true;
    } else if (currentMp !== undefined) {
         // If currentMp is provided but invalid
        return NextResponse.json({ error: 'Invalid currentMp value. Must be a non-negative integer.' }, { status: 400 });
    }
    // -----------------------------

    if (!hasValidUpdate) {
         return NextResponse.json({ error: 'No valid fields provided for update (currentHp or currentMp).' }, { status: 400 });
    }

    try {
        // TODO: Optional - Fetch maxHP/maxMP here to validate against if needed?
        // For now, just update the provided values.

        const { error, count } = await supabase
            .from('hunters')
            .update(updates)
            .eq('id', hunterId)
            .eq('user_id', userId); // Ensure ownership using userId

        if (error) {
            console.error(`Error updating hunter stats for ${hunterId}:`, error);
            throw new Error(`Database error updating stats: ${error.message}`);
        }

        if (count === 0) {
            // Could be wrong hunterId or user doesn't own it
             console.warn(`Update current stats failed: Hunter ${hunterId} not found or not owned by user ${userId}.`); // Use userId in log
             return NextResponse.json({ error: 'Hunter not found or access denied.' }, { status: 404 });
        }

        console.log(`Successfully updated stats for hunter ${hunterId}:`, updates);
        // Return simple success or fetch+return updated hunter if needed by client
        return NextResponse.json({ message: 'Stats updated successfully.' });

    } catch (error: any) {
        console.error('Unexpected error updating hunter stats:', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 