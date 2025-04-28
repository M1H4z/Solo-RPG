import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Input validation schema (optional but recommended)
import { z } from 'zod';

const purchaseSchema = z.object({
    hunterId: z.string().uuid(),
    itemId: z.string().min(1), // Assuming item ID is text
    quantity: z.number().int().positive().optional().default(1),
});

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Check Authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Validate Input
    let inputData;
    try {
        const rawData = await request.json();
        inputData = purchaseSchema.parse(rawData);
    } catch (error) {
        console.error("Invalid purchase input:", error);
        return NextResponse.json({ error: 'Invalid input data', details: error }, { status: 400 });
    }

    const { hunterId, itemId, quantity } = inputData;

    // 3. Call the Database Function
    try {
        const { data, error: rpcError } = await supabase.rpc('purchase_item', {
            p_hunter_id: hunterId,
            p_item_id: itemId,
            p_user_id: userId, // Pass user ID for authorization check within the function
            p_quantity: quantity
        });

        if (rpcError) {
            console.error('RPC Error purchasing item:', rpcError);
            // Provide a generic error unless you want to expose specific DB errors
            throw new Error('Database error during purchase.');
        }

        // The RPC function returns JSON directly {success: boolean, error?: string, ...}
        if (data && !data.success) {
             // Specific error message from the DB function
             return NextResponse.json({ error: data.error || 'Purchase failed' }, { status: 400 }); // Use 400 for known failures like insufficient funds
        }

        if (!data || !data.success) {
             // Catch-all for unexpected non-success returns from RPC
             return NextResponse.json({ error: 'Purchase failed for an unknown reason.' }, { status: 500 });
        }

        // 4. Return Success Response from DB function
        // The 'data' variable holds the JSON returned by the purchase_item function
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('API Error purchasing item:', error);
        // Use 500 for unexpected server/API level errors
        return NextResponse.json({ error: error.message || 'Failed to process purchase request' }, { status: 500 });
    }
} 