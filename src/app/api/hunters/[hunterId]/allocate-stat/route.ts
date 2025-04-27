import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSession } from "@/services/authService";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { hunterId: string };
}

// Define valid stat names that can be allocated
const VALID_STATS = [
  "strength",
  "agility",
  "perception",
  "intelligence",
  "vitality",
];

// POST handler to allocate a single stat point
export async function POST(request: Request, context: RouteContext) {
  const { hunterId } = context.params;
  const session = await getUserSession();
  const supabase = createSupabaseServerClient();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required" },
      { status: 400 },
    );
  }

  let statToAllocate: string;
  try {
    const body = await request.json();
    statToAllocate = body.statName;
    if (!statToAllocate || !VALID_STATS.includes(statToAllocate)) {
      throw new Error("Invalid stat name provided.");
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body. Expecting { "statName": string }.' },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  try {
    // --- Fetch current hunter points and the specific stat ---
    // Note: We select stat_points and the specific stat column dynamically
    const { data: currentHunter, error: fetchError } = await supabase
      .from("hunters")
      .select(`stat_points, ${statToAllocate}`) // Select points and the target stat
      .eq("id", hunterId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Not found
        return NextResponse.json(
          { error: "Hunter not found or access denied" },
          { status: 404 },
        );
      }
      console.error("Allocate Stat - Fetch Error:", fetchError);
      throw new Error("Database error fetching hunter stats");
    }
    if (!currentHunter) {
      return NextResponse.json(
        { error: "Hunter not found or access denied" },
        { status: 404 },
      );
    }

    // --- Check if points are available ---
    if ((currentHunter.stat_points ?? 0) <= 0) {
      return NextResponse.json(
        { error: "No stat points available to allocate." },
        { status: 400 },
      );
    }

    // --- Prepare update data ---
    // Dynamically create the update object
    const updatedData: { [key: string]: number } = {
      stat_points: (currentHunter.stat_points ?? 0) - 1, // Decrement stat points
      [statToAllocate]:
        (currentHunter[statToAllocate as keyof typeof currentHunter] ?? 0) + 1, // Increment target stat
    };

    // --- Update hunter in DB ---
    const { error: updateError } = await supabase
      .from("hunters")
      .update(updatedData)
      .eq("id", hunterId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Allocate Stat - Update Error:", updateError);
      throw new Error("Database error updating stats");
    }

    // --- Return success response ---
    // Optionally return the updated hunter data if needed by the frontend
    // For now, just confirm success
    return NextResponse.json({
      message: `Successfully allocated 1 point to ${statToAllocate}.`,
      newStatPoints: updatedData.stat_points,
      updatedStat: statToAllocate,
      newStatValue: updatedData[statToAllocate],
    });
  } catch (error: any) {
    console.error(`API Error allocating stat for hunter ${hunterId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to allocate stat point" },
      { status: 500 },
    );
  }
}
