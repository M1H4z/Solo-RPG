import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Zod schema for input validation
const abandonGateSchema = z.object({
    // We'll use hunterId to find the gate to abandon, ensuring RLS handles ownership
    hunterId: z.string().uuid(), 
});

// Define necessary RLS policy for DELETE on active_gates
// Example Policy (needs to be added via migration or dashboard):
/*
CREATE POLICY "Allow owner DELETE" ON public.active_gates
    FOR DELETE
    USING (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = active_gates.hunter_id));
*/

export async function POST(request: Request) { // Using POST for simplicity, could be DELETE
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Get User Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Validate Input
    let inputData;
    try {
        const rawData = await request.json();
        inputData = abandonGateSchema.parse(rawData);
    } catch (error) {
        console.error("Invalid abandon gate input:", error);
        return NextResponse.json({ error: 'Invalid input data', details: error }, { status: 400 });
    }
    const { hunterId } = inputData;

    try {
        // 3. Attempt to delete the active gate for the hunter
        // RLS policy ensures the user can only delete a gate associated with their own hunter.
        const { error: deleteError, count } = await supabase
            .from('active_gates')
            .delete()
            .eq('hunter_id', hunterId); // Match the hunter
            // The implicit RLS check auth.uid() = hunter.user_id provides authorization

        if (deleteError) {
            console.error("Error deleting active gate:", deleteError);
            if (deleteError.code === '42501') { // RLS violation
                 throw new Error('Database security policy prevented gate abandonment.');
            }
            throw new Error('Failed to abandon gate in database.');
        }

        if (count === 0) {
             // This could happen if the gate expired or was already abandoned
             console.warn(`Attempted to abandon gate for hunter ${hunterId}, but no active gate was found.`);
             // Return success anyway, as the desired state (no active gate) is achieved
        }

        // 4. Return Success Response
        return NextResponse.json({ success: true, message: 'Gate abandoned successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Error abandoning gate:', error);
        return NextResponse.json({ error: error.message || 'Failed to process gate abandonment request' }, { status: 500 });
    }
} 