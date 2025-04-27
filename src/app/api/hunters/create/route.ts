import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { HUNTER_CLASSES } from '@/constants/classes';
import { HunterClass } from '@/constants/classes';
import { getUserSession } from '@/services/authService';
import { getMyHunters } from '@/services/hunterService';

export const dynamic = 'force-dynamic'; // Ensure dynamic execution

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }
  
  const name = formData.get('name') as string;
  const selectedClass = formData.get('class') as HunterClass;

  // --- Validation --- 
  if (!name || !selectedClass) {
    return NextResponse.json({ error: 'Hunter name and class are required.' }, { status: 400 });
  }

  if (!HUNTER_CLASSES[selectedClass]) {
    return NextResponse.json({ error: 'Invalid hunter class selected.' }, { status: 400 });
  }

  // Check hunter limit
  try {
    const existingHunters = await getMyHunters(); // Re-use existing service function
    if (existingHunters.length >= 2) {
      return NextResponse.json({ error: 'Maximum number of hunters (2) reached.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error checking hunter count:', error);
    return NextResponse.json({ error: 'Could not verify hunter count.' }, { status: 500 });
  }

  // --- Prepare Hunter Data --- 
  const classDefinition = HUNTER_CLASSES[selectedClass];
  const initialStats = classDefinition.baseStats;

  const newHunterData = {
    user_id: userId,
    name: name.trim(),
    class: selectedClass,
    level: 1,
    rank: 'E', // Initial rank
    experience: 0,
    strength: initialStats.strength,
    agility: initialStats.agility,
    perception: initialStats.perception,
    intelligence: initialStats.intelligence,
    vitality: initialStats.vitality,
    skill_points: 0, // Start with 0, gain on level up
    stat_points: 0, // Start with 0 allocated (50 base are inherent), gain on level up
  };

  // --- Database Insertion --- 
  try {
    const { data, error } = await supabase
      .from('hunters')
      .insert(newHunterData)
      .select() // Select the newly created hunter data
      .single(); // Expecting only one row

    if (error) {
      console.error('Error creating hunter:', error);
      if (error.code === '23505') { // Unique violation (likely name)
        return NextResponse.json({ error: 'A hunter with this name already exists.' }, { status: 409 }); // 409 Conflict
      }
      return NextResponse.json({ error: 'Could not create hunter in database.' }, { status: 500 });
    }

    console.log('Hunter created successfully:', data);
    return NextResponse.json({ message: 'Hunter created successfully!', hunter: data }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Unexpected error during hunter creation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 