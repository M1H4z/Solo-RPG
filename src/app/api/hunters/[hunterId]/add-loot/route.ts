import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';
import { LootDrop } from '@/constants/lootTables.constants'; // Import type
import { addInventoryItem } from '@/services/inventoryService'; // Import the service function

interface AddLootPayload {
    items?: LootDrop[];
    gold?: number;
}

export async function POST(
    request: Request,
    { params }: { params: { hunterId: string } }
) {
    const user = await getAuthenticatedUser(); // Call new function
    const { hunterId } = params;

    if (!user) { // Check for user object
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id; // Use user.id

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    let payload: AddLootPayload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { items, gold } = payload;
    const goldToAdd = (typeof gold === 'number' && gold > 0) ? gold : 0;
    // Keep filtering logic
    const itemsToAdd = Array.isArray(items) ? items.filter(item => item.itemId && item.quantity > 0) : [];

    if (goldToAdd === 0 && itemsToAdd.length === 0) {
         return NextResponse.json({ error: 'No valid loot (items or gold) provided.' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient(); // Create client here for the gold RPC call

    try {
        // --- Update Gold (if applicable) ---
        if (goldToAdd > 0) {
             console.log(`Adding ${goldToAdd} gold to hunter ${hunterId}`);
            const { error: goldError } = await supabase
                .rpc('adjust_hunter_gold', { // Use RPC for atomic increment
                     p_hunter_id: hunterId,
                     p_user_id: userId, // Use userId
                     p_amount: goldToAdd
                });

            if (goldError) {
                console.error(`Error adding gold for hunter ${hunterId}:`, goldError);
                throw new Error(`Database error adding gold: ${goldError.message}`);
            }
        }

        // --- Add Items (if applicable) using the service ---
        if (itemsToAdd.length > 0) {
            console.log(`[add-loot] Starting item addition loop for ${itemsToAdd.length} item types.`);
            // Loop through items and call the service function for each
            for (const itemDrop of itemsToAdd) {
                 console.log(`[add-loot] Calling addInventoryItem for: Hunter=${hunterId}, Item=${itemDrop.itemId}, Qty=${itemDrop.quantity}`);
                 const { success, error } = await addInventoryItem(
                     hunterId,
                     itemDrop.itemId,
                     itemDrop.quantity
                 );
                 console.log(`[add-loot] Result for ${itemDrop.itemId}: Success=${success}, Error=${error || 'None'}`);

                 if (!success) {
                     console.error(`[add-loot] Failed to add item ${itemDrop.itemId} via service: ${error}`);
                     throw new Error(error || `Failed to add item ${itemDrop.itemId}`);
                 }
            }
            console.log(`[add-loot] Finished item addition loop.`);
        }

        console.log(`[add-loot] Successfully processed loot for hunter ${hunterId}. Sending success response.`);
        // Return a success message, potentially include details if needed later
        return NextResponse.json({ message: 'Loot processed successfully.' });

    } catch (error: any) {
        console.error('[add-loot] CATCH BLOCK: Error processing loot:', error);
        // Return a generic server error message, or the specific error if caught
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred while processing loot.' }, { status: 500 });
    }
}
