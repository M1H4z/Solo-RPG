import { NextResponse } from 'next/server';
import { dropInventoryItem } from '@/services/inventoryService';
import { getUserSession } from '@/services/authService';

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
  let quantity: number = 1; // Default to dropping 1 (or the whole stack if < 1)

  try {
    const body = await request.json();
    inventoryId = body.inventoryId;
    if (body.quantity !== undefined && typeof body.quantity === 'number' && body.quantity > 0) {
        quantity = body.quantity;
    }

    if (!inventoryId) {
      return NextResponse.json({ error: 'Inventory item ID (inventoryId) is required' }, { status: 400 });
    }

    console.log(`API Request: Drop item ${inventoryId} (qty: ${quantity}) for hunter ${hunterId}`);

    const result = await dropInventoryItem(hunterId, inventoryId, quantity);

    if (!result.success) {
        // Determine appropriate status code based on error
        const status = result.error?.includes('Unauthorized') ? 403 : result.error?.includes('not found') ? 404 : 400;
        return NextResponse.json({ error: result.error || 'Failed to drop item' }, { status });
    }

    console.log(`API Success: Item dropped for hunter ${hunterId}. Updated inventory length: ${result.updatedInventory?.length}`);
    return NextResponse.json({ 
        message: 'Item dropped successfully', 
        inventory: result.updatedInventory 
    });

  } catch (error: any) {
    console.error(`API Error dropping item for hunter ${hunterId}:`, error);
    // Handle JSON parsing errors or unexpected issues
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 