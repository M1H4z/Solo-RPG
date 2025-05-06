import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

// Tell Next.js not to cache this route
export const dynamic = 'force-dynamic';

// Type for the expected response data
type ActiveGateData = Database['public']['Tables']['active_gates']['Row'];

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get hunterId from query parameters
    const { searchParams } = new URL(request.url);
    const hunterId = searchParams.get('hunterId');

    if (!hunterId) {
        return NextResponse.json({ error: 'Missing hunterId parameter' }, { status: 400 });
    }

    try {
        // 3. Query the active_gates table
        // RLS policy ensures we only get the gate if the user owns the hunter
        const { data: activeGate, error: gateError } = await supabase
            .from('active_gates')
            .select('*') // Select all columns for now
            .eq('hunter_id', hunterId)
            .maybeSingle(); // Expect 0 or 1 result

        if (gateError) {
            console.error('Error fetching active gate:', gateError);
            throw new Error('Failed to retrieve gate status from database.');
        }

        // 4. Check for expired gates (optional cleanup)
        if (activeGate && new Date(activeGate.expires_at) < new Date()) {
             console.log(`Found expired gate for hunter ${hunterId}, ID: ${activeGate.id}.`);
            // Optionally: Implement logic here or in a separate cron job
            // to delete expired gates automatically.
            // For now, we'll just return null as if it doesn't exist.
            return NextResponse.json({ activeGate: null }, { status: 200 });
        }

        // 5. Return the result
        return NextResponse.json({ activeGate }, { status: 200 });

    } catch (error: any) {
        console.error('API Error getting gate status:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gate status request' }, { status: 500 });
    }
} 