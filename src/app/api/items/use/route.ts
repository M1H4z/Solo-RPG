import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/authService';
import { useConsumableItem } from '@/services/inventoryService';

interface UseItemPayload {
    hunterId: string;
    inventoryInstanceId: string;
}

export async function POST(request: Request) {
    const session = await getUserSession();
    if (!session?.user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let payload: UseItemPayload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const { hunterId, inventoryInstanceId } = payload;

    if (!hunterId || !inventoryInstanceId) {
        return NextResponse.json({ success: false, message: 'Missing hunterId or inventoryInstanceId' }, { status: 400 });
    }

    try {
        console.log(`[API /items/use] Attempting to use item: Hunter=${hunterId}, Instance=${inventoryInstanceId}`);
        const result = await useConsumableItem(hunterId, inventoryInstanceId);
        console.log(`[API /items/use] Result:`, result);

        // Determine status code based on success
        const statusCode = result.success ? 200 : 400; // Use 400 for general failures like "not consumable"

        return NextResponse.json(result, { status: statusCode });

    } catch (error: any) {
        // Catch unexpected errors from the service function (though it should handle its own)
        console.error('[API /items/use] Unexpected error:', error);
        return NextResponse.json({ success: false, message: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 