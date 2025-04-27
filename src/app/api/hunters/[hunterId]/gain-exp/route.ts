import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserSession } from '@/services/authService';
import { calculateLevelFromExp } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { hunterId: string };
}

// POST handler to add experience and handle level ups
export async function POST(request: Request, context: RouteContext) {
  const { hunterId } = context.params;
  const session = await getUserSession();
  const supabase = createSupabaseServerClient();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hunterId) {
    return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
  }

  let experienceGained: number;
  try {
    const body = await request.json();
    experienceGained = parseInt(body.experienceGained, 10);
    if (isNaN(experienceGained) || experienceGained <= 0) {
      throw new Error('Invalid experience amount.');
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body. Expecting { "experienceGained": number }.' }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // --- 1. Fetch current hunter data --- 
    const { data: currentHunter, error: fetchError } = await supabase
      .from('hunters')
      .select('experience, stat_points, skill_points') // Select only needed fields
      .eq('id', hunterId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Hunter not found or access denied' }, { status: 404 });
      }
      console.error('Gain EXP - Fetch Error:', fetchError);
      throw new Error('Database error fetching hunter');
    }

    if (!currentHunter) {
       return NextResponse.json({ error: 'Hunter not found or access denied' }, { status: 404 });
    }

    // --- 2. Calculate updates --- 
    const oldLevel = calculateLevelFromExp(currentHunter.experience ?? 0);
    const newExperience = (currentHunter.experience ?? 0) + experienceGained;
    const newLevel = calculateLevelFromExp(newExperience);

    let statPointsGained = 0;
    let skillPointsGained = 0;
    let levelUpOccurred = false;

    if (newLevel > oldLevel) {
      levelUpOccurred = true;
      const levelsGained = newLevel - oldLevel;
      statPointsGained = levelsGained * 5;
      skillPointsGained = levelsGained * 5;
      console.log(`Hunter ${hunterId} leveled up! ${oldLevel} -> ${newLevel}. Gained ${statPointsGained} stat points, ${skillPointsGained} skill points.`);
      // TODO: Implement HP/MP recovery logic here if needed
    }

    const updatedData: { 
        experience: number; 
        stat_points: number; 
        skill_points: number; 
        level?: number; // Add level field conditionally
    } = {
      experience: newExperience,
      stat_points: (currentHunter.stat_points ?? 0) + statPointsGained,
      skill_points: (currentHunter.skill_points ?? 0) + skillPointsGained,
      // updated_at: new Date().toISOString(), // Optional: update timestamp
    };

    // Conditionally add the level to the update object ONLY if it changed
    // This avoids unnecessary writes if only EXP was gained without a level up.
    if (levelUpOccurred) {
      updatedData.level = newLevel;
    }

    // --- 3. Update hunter in DB --- 
    const { error: updateError } = await supabase
      .from('hunters')
      .update(updatedData) // Now includes level if it changed
      .eq('id', hunterId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Gain EXP - Update Error:', updateError);
      throw new Error('Database error updating hunter');
    }

    // --- 4. Return success response --- 
    return NextResponse.json({
      message: `Gained ${experienceGained} EXP.`,
      levelUp: levelUpOccurred,
      newLevel: newLevel,
      levelsGained: newLevel - oldLevel,
      statPointsGained,
      skillPointsGained,
      newTotalExperience: newExperience,
      newTotalStatPoints: updatedData.stat_points,
      newTotalSkillPoints: updatedData.skill_points
    });

  } catch (error: any) {
    console.error(`API Error gaining EXP for hunter ${hunterId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to process experience gain' }, { status: 500 });
  }
} 