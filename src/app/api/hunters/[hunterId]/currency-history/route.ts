import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types'; // Corrected path

// Explicitly force dynamic execution for this route
export const dynamic = 'force-dynamic';

type CurrencyTransaction = Database['public']['Tables']['currency_transactions']['Row'];

interface Params {
    hunterId: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { hunterId } = params;

    if (!hunterId) {
        return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    try {
        // 1. Check Authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error(userError.message);
        if (!user) throw new Error('Unauthorized: No authenticated user');
        const userId = user.id;

        // 2. Verify Hunter Ownership (Explicit Check)
        const { data: hunterData, error: hunterError } = await supabase
            .from('hunters')
            .select('user_id')
            .eq('id', hunterId)
            .single();

        if (hunterError) {
            console.error('Error fetching hunter for auth check:', hunterError);
            if (hunterError.code === 'PGRST116') { // Not found
                 return NextResponse.json({ error: 'Hunter not found' }, { status: 404 });
            }
            throw new Error('Failed to verify hunter ownership');
        }

        if (hunterData.user_id !== userId) {
            console.warn(`Auth Warning: User ${userId} attempted to access currency history for hunter ${hunterId} owned by ${hunterData.user_id}`);
            return NextResponse.json({ error: 'Forbidden: You do not own this hunter' }, { status: 403 });
        }

        // 3. Fetch Currency Transactions (User is authenticated and owns the hunter)
        const { data: transactions, error: transactionsError } = await supabase
            .from('currency_transactions')
            .select('*')
            .eq('hunter_id', hunterId)
            .order('transaction_time', { ascending: true }); // Fetching history

        if (transactionsError) {
            console.error(`Error fetching currency history for hunter ${hunterId}:`, transactionsError);
            throw transactionsError; // Propagate DB error
        }

        // 4. Return Transactions with Cache-Control Headers
        return NextResponse.json(
            { transactions: transactions || [] }, 
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Surrogate-Control': 'no-store'
                }
            }
        );

    } catch (error: any) {
        console.error('API Error in GET /currency-history:', error.message, error); // Log full error too
        // Return appropriate status code based on error message
        if (error.message?.startsWith('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized: No authenticated user' }, { status: 401 });
        }
        if (error.message?.startsWith('Forbidden')) {
             return NextResponse.json({ error: 'Forbidden: You do not own this hunter' }, { status: 403 });
        }
        // Generic server error for others - use a static message
        return NextResponse.json({ error: 'Internal Server Error processing currency history request.' }, { status: 500 });
    }
} 