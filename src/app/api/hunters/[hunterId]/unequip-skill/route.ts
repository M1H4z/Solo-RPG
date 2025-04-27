import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unequipSkill } from '@/services/skillService';
import { getUserSession } from '@/services/authService'; // Correct function name

export async function POST(
    request: Request,
    { params }: { params: { hunterId: string } }
) {
    console.log(`[API /unequip-skill] Received request for hunter: ${params.hunterId}`);
    const supabase = createSupabaseServerClient();
    const session = await getUserSession(); // Call correct function

    if (!session?.user) { // Check session and user
        console.error('[API /unequip-skill] Unauthorized: No user session.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user; // Extract user
    console.log(`[API /unequip-skill] User authenticated: ${user.id}`);

    let skillId: string;
    try {
        const body = await request.json();
        skillId = body.skillId;
        if (!skillId) {
            throw new Error('Skill ID is required in request body.');
        }
        console.log(`[API /unequip-skill] Parsed skillId: ${skillId}`);
    } catch (e: any) {
        console.error('[API /unequip-skill] Invalid request body:', e.message);
        return NextResponse.json({ error: 'Invalid request body. Expecting { "skillId": "string" }.' }, { status: 400 });
    }

    const hunterId = params.hunterId;

    if (!hunterId) {
        console.error('[API /unequip-skill] Missing hunterId in path.');
        return NextResponse.json({ error: 'Hunter ID is required in URL path.' }, { status: 400 });
    }

    try {
        console.log(`[API /unequip-skill] Calling unequipSkill service for user: ${user.id}, hunter: ${hunterId}, skill: ${skillId}`);
        const result = await unequipSkill(user.id, hunterId, skillId); // Use correct user variable
        console.log(`[API /unequip-skill] unequipSkill service returned:`, result);

        if (!result.success) {
            console.warn(`[API /unequip-skill] unequipSkill failed: ${result.message}`);
            const status = result.message.startsWith('Failed to') || result.message.includes('unexpected') ? 500 : 400;
            return NextResponse.json({ error: result.message }, { status });
        }

        console.log(`[API /unequip-skill] Success: ${result.message}`);
        // Return success message only
        return NextResponse.json({ 
            success: true, 
            message: result.message, 
        });
    } catch (error: any) {
        console.error(`[API /unequip-skill] UNEXPECTED ERROR in route handler:`, error);
        return NextResponse.json({ error: 'Internal Server Error in API route.' }, { status: 500 });
    }
} 