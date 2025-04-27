import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getUserSession } from "@/services/authService";
import { getMyHunters } from "@/services/hunterService"; // Re-use the existing service function

export const dynamic = "force-dynamic"; // Ensure fresh data on every request

export async function GET(request: Request) {
  const session = await getUserSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the server-side function to get hunters
    const hunters = await getMyHunters();
    return NextResponse.json({ hunters }, { status: 200 });
  } catch (error: any) {
    console.error("API error fetching hunters:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch hunters." },
      { status: 500 },
    );
  }
}
