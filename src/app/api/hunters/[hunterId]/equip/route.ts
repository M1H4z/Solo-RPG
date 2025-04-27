import { NextResponse } from 'next/server';
import { equipItem, getHunterInventory, getHunterEquipment } from '@/services/inventoryService';
import { createSupabaseServerClient } from '@/lib/supabase/server';
// No longer need UUID here unless for other logic
// import { v4 as uuidv4 } from 'uuid';
// No longer need MOCK_ITEMS_DB here directly
// import { MOCK_ITEMS_DB } from '@/lib/mockItems';

// Import shared state
// import { 
//     mockHunterInventory, 
//     mockHunterEquipment, 
//     updateMockInventory, 
//     updateMockEquipment 
// } from '@/lib/mockHunterState';

// Remove local state definition
// // --- Temporary In-Memory Store --- 
// // ... local definitions ...
// // --------------------------------

// Helper function to find an item in inventory by its unique inventoryId
// function findInventoryItem(inventoryId: string): InventoryItem | undefined {
//     // Find from the shared state
//     return mockHunterInventory.find(item => item.inventoryId === inventoryId);
// }

export async function POST(request: Request, { params }: { params: { hunterId: string } }) {
    const hunterId = params.hunterId;
    const supabase = createSupabaseServerClient(); 

    // Basic validation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // TODO: Add check if hunter belongs to session user

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { inventoryId } = body; // inventoryId is the instance_id

        if (!inventoryId || typeof inventoryId !== 'string') {
            return NextResponse.json({ error: 'inventoryId (string) is required to equip an item' }, { status: 400 });
        }

        // Call the service function to equip the item
        const equipResult = await equipItem(hunterId, inventoryId);

        if (!equipResult.success) {
            const statusCode = equipResult.error?.includes('not found') ? 404 : 400; // 404 if instance missing, 400 otherwise
            return NextResponse.json({ error: equipResult.error || 'Failed to equip item.' }, { status: statusCode });
        }
        
        // Equip was successful, fetch the current inventory state to return alongside equipment
        // In a more complex scenario (e.g., equipping a two-handed weapon might unequip off-hand),
        // the service layer might handle returning both states, but this is simpler for now.
        const currentInventory = await getHunterInventory(hunterId); 

        return NextResponse.json({
            message: `Successfully equipped item ${inventoryId}`, // TODO: Get item name?
            equipment: equipResult.updatedEquipment, 
            inventory: currentInventory, // Return current inventory state
        });

    } catch (error: any) {
        console.error(`API Error equipping item for hunter ${hunterId}:`, error);
        return NextResponse.json({ error: error.message || 'Failed to equip item' }, { status: 500 });
    }
}

// Remove the temporary GET handler - it's no longer needed
// // --- Temporary GET for testing --- 
// // ... handler code ... 