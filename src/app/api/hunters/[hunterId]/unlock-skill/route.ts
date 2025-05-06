import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unlockSkill } from "@/services/skillService";
import { getAuthenticatedUser } from "@/services/authService";

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } },
) {
  console.log(
    `[API /unlock-skill] Received request for hunter: ${params.hunterId}`,
  );
  const supabase = createSupabaseServerClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    console.error("[API /unlock-skill] Unauthorized: No authenticated user.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[API /unlock-skill] User authenticated: ${user.id}`);

  let skillId: string;
  try {
    const body = await request.json();
    skillId = body.skillId;
    if (!skillId) {
      throw new Error("Skill ID is required in request body.");
    }
    console.log(`[API /unlock-skill] Parsed skillId: ${skillId}`);
  } catch (e: any) {
    console.error("[API /unlock-skill] Invalid request body:", e.message);
    return NextResponse.json(
      { error: 'Invalid request body. Expecting { "skillId": "string" }.' },
      { status: 400 },
    );
  }

  const hunterId = params.hunterId;

  if (!hunterId) {
    console.error("[API /unlock-skill] Missing hunterId in path.");
    return NextResponse.json(
      { error: "Hunter ID is required in URL path." },
      { status: 400 },
    );
  }

  try {
    console.log(
      `[API /unlock-skill] Calling unlockSkill service for user: ${user.id}, hunter: ${hunterId}, skill: ${skillId}`,
    );
    const result = await unlockSkill(user.id, hunterId, skillId);
    console.log(`[API /unlock-skill] unlockSkill service returned:`, result);

    if (!result.success) {
      console.warn(`[API /unlock-skill] unlockSkill failed: ${result.message}`);
      const status =
        result.message.startsWith("Failed to") ||
        result.message.includes("unexpected")
          ? 500
          : 400;
      return NextResponse.json({ error: result.message }, { status });
    }

    console.log(`[API /unlock-skill] Success: ${result.message}`);
    // Return success message AND updated hunter data
    return NextResponse.json({
      success: true,
      message: result.message,
      hunter: result.updatedHunter,
    });
  } catch (error: any) {
    console.error(
      `[API /unlock-skill] UNEXPECTED ERROR in route handler:`,
      error,
    );
    // Generic 500 for truly unexpected crashes in the route handler itself
    return NextResponse.json(
      { error: "Internal Server Error in API route." },
      { status: 500 },
    );
  }
}
