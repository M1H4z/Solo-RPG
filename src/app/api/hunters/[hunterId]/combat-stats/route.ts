import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types';

// Tell Next.js not to cache this route
export const dynamic = 'force-dynamic';

// Define the expected structure for combat stats
// Matches PlayerCombatEntity in DungeonViewClientContent
interface HunterCombatStats {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    level: number;
    attackPower: number;
    defense: number;
    currentExp: number;
    expToNextLevel: number;
}

interface RouteParams {
  params: { hunterId: string };
}

// Function to calculate stats using direct columns from hunter object
const calculateCombatStats = (hunter: Database['public']['Tables']['hunters']['Row']): HunterCombatStats => {
    // TODO: Implement proper stat calculation based on base stats, level, class, equipment etc.
    
    // Access stats directly from hunter object columns
    const maxHp = (hunter.vitality || 0) * 10 + 50; // Example: 10 HP per Vitality + base 50
    const attackPower = (hunter.strength || 0) * 2 + 5; // Example: 2 Attack per Strength + base 5
    const defense = (hunter.vitality || 0) * 1 + 2; // Example: 1 Defense per Vitality + base 2

    return {
        id: hunter.id,
        name: hunter.name,
        currentHp: maxHp, // Assume full HP when fetching for combat start
        maxHp: maxHp,
        level: hunter.level,
        attackPower: attackPower,
        defense: defense,
        // Use the correct column name: 'experience'
        currentExp: hunter.experience, 
        // Use the correct column name: 'next_level_experience'
        expToNextLevel: hunter.next_level_experience,
    };
};

export async function GET(request: Request, { params }: RouteParams) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();
    const { hunterId } = params;

    // 1. Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Combat Stats API: Unauthorized - No user found or error', userError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate hunterId
    if (!hunterId) {
        console.error('Combat Stats API: Bad Request - Missing hunterId');
        return NextResponse.json({ error: 'Missing hunterId parameter' }, { status: 400 });
    }

    try {
        // 3. Fetch the hunter data, ensuring ownership
        const { data, error: fetchError } = await supabase
            .from('hunters')
            .select('*') // Select all needed fields
            .eq('id', hunterId)
            .eq('user_id', userId) // Ensure the requesting user owns this hunter
            .single(); // Expect exactly one hunter
            
        // Explicitly type the hunter variable after fetching
        // Type should be correct now based on database.types.ts generated from schema
        const hunter: Database['public']['Tables']['hunters']['Row'] | null = data;

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // PostgREST code for "Searched for one row but found 0"
                 console.warn(`Combat Stats API: Hunter ${hunterId} not found or not owned by user ${userId}`);
                return NextResponse.json({ error: 'Hunter not found or access denied.' }, { status: 404 });
            }
            console.error(`Combat Stats API: Error fetching hunter ${hunterId}:`, fetchError);
            throw new Error('Failed to retrieve hunter details.');
        }

        // Add a null check after explicit typing
        if (!hunter) {
            // This case should theoretically be covered by the PGRST116 check above,
            // but it's good practice for type safety.
             console.warn(`Combat Stats API: Hunter data was unexpectedly null after fetch for ${hunterId}`);
            return NextResponse.json({ error: 'Hunter data not found after fetch.' }, { status: 404 });
        }

        // 4. Calculate/Format Combat Stats
        const combatStats = calculateCombatStats(hunter);

        // 5. Return success response
        return NextResponse.json(combatStats, { status: 200 });

    } catch (error: any) {
        console.error('API Error fetching hunter combat stats:', error);
        return NextResponse.json({ error: error.message || 'Failed to process hunter stats request' }, { status: 500 });
    }
} 