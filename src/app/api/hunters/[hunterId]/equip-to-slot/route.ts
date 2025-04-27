import { NextResponse } from 'next/server';
import { equipItemToSpecificSlot } from '@/services/inventoryService'; // We will create this service function next
import { getUserSession } from '@/services/authService';
import { isEquipmentSlotType } from '@/services/inventoryService'; // Import the type guard
import { EquipmentSlotType } from '@/types/item.types';

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } }
) {
  const session = await getUserSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hunterId } = params;
  if (!hunterId) {
    return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
  }

  let inventoryId: string;
  let targetSlot: EquipmentSlotType;

  try {
    const body = await request.json();
    inventoryId = body.inventoryId;
    targetSlot = body.targetSlot;

    // Basic validation
    if (!inventoryId) {
      return NextResponse.json({ error: 'Inventory item ID (inventoryId) is required' }, { status: 400 });
    }
    if (!targetSlot) {
        return NextResponse.json({ error: 'Target equipment slot (targetSlot) is required' }, { status: 400 });
    }
    // Use the type guard to validate the slot string
    if (!isEquipmentSlotType(targetSlot)) {
        return NextResponse.json({ error: `Invalid target equipment slot: ${targetSlot}` }, { status: 400 });
    }

    console.log(`API Request: Equip item ${inventoryId} to specific slot ${targetSlot} for hunter ${hunterId}`);

    // Call the new service function (to be created)
    const result = await equipItemToSpecificSlot(hunterId, inventoryId, targetSlot);

    if (!result.success) {
        // Determine appropriate status code based on error type
        const status = result.error?.includes('Unauthorized') ? 403 
                     : result.error?.includes('not found') ? 404 
                     : result.error?.includes('Cannot equip') ? 400 // Bad request (invalid slot for item)
                     : 500; // Default to internal server error
        console.error(`API Error equipping item to slot: ${result.error}`);
        return NextResponse.json({ error: result.error || 'Failed to equip item to slot' }, { status });
    }

    console.log(`API Success: Item ${inventoryId} equipped to slot ${targetSlot} for hunter ${hunterId}.`);
    // Return the updated equipment state, similar to the default equip
    return NextResponse.json({ 
        message: 'Item equipped successfully to specified slot', 
        equipment: result.updatedEquipment 
    });

  } catch (error: any) {
    console.error(`API Error equipping item to slot for hunter ${hunterId}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 