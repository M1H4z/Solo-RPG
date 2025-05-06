import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const adjustGoldSchema = z.object({
  amount: z.number().int(), // Can be positive or negative
});

interface Params {
    hunterId: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { hunterId } = params;

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    // 1. Check Authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate Input
    let inputData;
    try {
        const rawData = await request.json();
        inputData = adjustGoldSchema.parse(rawData);
    } catch (error) {
        console.error("Invalid adjust gold input:", error);
        return NextResponse.json({ error: 'Invalid input: amount must be an integer.' }, { status: 400 });
    }
    const { amount } = inputData;

    // 3. Call the Database Function
    try {
        const { data, error: rpcError } = await supabase.rpc('adjust_hunter_gold', {
            p_hunter_id: hunterId,
            p_user_id: userId,
            p_amount: amount
        });

        if (rpcError) {
            console.error('RPC Error adjusting gold:', rpcError);
            throw new Error('Database error during gold adjustment.');
        }

        // Handle potential errors returned from the DB function ({success: false, error: message})
        if (data && !data.success) {
             return NextResponse.json({ error: data.error || 'Gold adjustment failed' }, { status: 400 });
        }
        if (!data || !data.success) {
             return NextResponse.json({ error: 'Gold adjustment failed for an unknown reason.' }, { status: 500 });
        }

        // 4. Return Success Response from DB function
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('API Error adjusting gold:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gold adjustment' }, { status: 500 });
    }
} 