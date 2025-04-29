import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

// Tell Next.js not to cache this route
export const dynamic = 'force-dynamic';

// Type for the expected response data
type ActiveGateData = Database['public']['Tables']['active_gates']['Row'];

interface RouteParams {
  params: { gateId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { gateId } = params;

    // 1. Get User Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Validate gateId
    if (!gateId) {
        return NextResponse.json({ error: 'Missing gateId parameter' }, { status: 400 });
    }

    try {
        // 3. Query the active_gates table using gateId
        const { data: activeGate, error: gateError } = await supabase
            .from('active_gates')
            .select('*, hunters(user_id)') // Select gate details and the associated hunter's user_id
            .eq('id', gateId)
            .maybeSingle(); // Expect 0 or 1 result

        if (gateError) {
            console.error('Error fetching active gate by ID:', gateError);
            throw new Error('Failed to retrieve gate details from database.');
        }

        // 4. Authorization Check & Not Found Check
        if (!activeGate) {
             return NextResponse.json({ error: 'Active gate not found.' }, { status: 404 });
        }
        // Ensure the fetched gate belongs to a hunter owned by the current user
        // The nested select returns `hunters: { user_id: string | null } | null`
        if (!activeGate.hunters || activeGate.hunters.user_id !== userId) {
             console.warn(`Unauthorized attempt to access gate ${gateId} by user ${userId}`);
             return NextResponse.json({ error: 'Forbidden: You do not have access to this gate.' }, { status: 403 });
        }

        // 5. Check for expired gates
        if (new Date(activeGate.expires_at) < new Date()) {
             console.log(`Attempted to access expired gate ${gateId}.`);
             // Maybe delete the gate here? For now, return error.
             return NextResponse.json({ error: 'This gate has expired.' }, { status: 410 }); // 410 Gone
        }

        // 6. Return the result (excluding the nested hunter info)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hunters, ...gateData } = activeGate;
        return NextResponse.json({ activeGate: gateData as ActiveGateData }, { status: 200 });

    } catch (error: any) {
        console.error('API Error getting gate details:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gate details request' }, { status: 500 });
    }
} 