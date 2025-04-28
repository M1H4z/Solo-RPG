import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { equipSkill } from "@/services/skillService";
import { getUserSession } from "@/services/authService";

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } },
) {
  console.log(
    `[API /equip-skill] Received request for hunter: ${params.hunterId}`,
  );
  const supabase = createSupabaseServerClient();
  const session = await getUserSession();

  if (!session?.user) {
    console.error("[API /equip-skill] Unauthorized: No user session.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;
  console.log(`[API /equip-skill] User authenticated: ${user.id}`);

  let skillId: string;
  try {
    const body = await request.json();
    skillId = body.skillId;
    if (!skillId) {
      throw new Error("Skill ID is required in request body.");
    }
    console.log(`[API /equip-skill] Parsed skillId: ${skillId}`);
  } catch (e: any) {
    console.error("[API /equip-skill] Invalid request body:", e.message);
    return NextResponse.json(
      { error: 'Invalid request body. Expecting { "skillId": "string" }.' },
      { status: 400 },
    );
  }

  const hunterId = params.hunterId;

  if (!hunterId) {
    console.error("[API /equip-skill] Missing hunterId in path.");
    return NextResponse.json(
      { error: "Hunter ID is required in URL path." },
      { status: 400 },
    );
  }

  try {
    console.log(
      `[API /equip-skill] Calling equipSkill service for user: ${user.id}, hunter: ${hunterId}, skill: ${skillId}`,
    );
    const result = await equipSkill(user.id, hunterId, skillId);
    console.log(`[API /equip-skill] equipSkill service returned:`, result);

    if (!result.success) {
      console.warn(`[API /equip-skill] equipSkill failed: ${result.message}`);
      const status =
        result.message.startsWith("Failed to") ||
        result.message.includes("unexpected")
          ? 500
          : 400;
      return NextResponse.json({ error: result.message }, { status });
    }

    console.log(`[API /equip-skill] Success: ${result.message}`);
    return NextResponse.json({
      success: true,
      message: result.message,
      hunter: result.updatedHunter,
    });
  } catch (error: any) {
    console.error(
      `[API /equip-skill] UNEXPECTED ERROR in route handler:`,
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error in API route." },
      { status: 500 },
    );
  }
}
