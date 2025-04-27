import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getUserSession } from "@/services/authService";
import { deleteMyHunter, getHunterById } from "@/services/hunterService";

export const dynamic = "force-dynamic";

interface DeleteParams {
  params: {
    hunterId: string;
  };
}

export async function DELETE(request: Request, { params }: DeleteParams) {
  const session = await getUserSession();
  const { hunterId } = params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required." },
      { status: 400 },
    );
  }

  try {
    // Call the service function to delete the hunter
    const result = await deleteMyHunter(hunterId);

    if (!result.success) {
      // Handle specific errors like not found / access denied vs internal errors
      const status =
        result.error === "Hunter not found or access denied." ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    // Successfully deleted
    // Use 204 No Content for successful deletions with no body
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("API error deleting hunter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete hunter." },
      { status: 500 },
    );
  }
}

// Define the expected shape of the context parameters
interface RouteContext {
  params: { hunterId: string };
}

/**
 * GET handler to fetch a specific hunter by ID.
 */
export async function GET(request: Request, context: RouteContext) {
  const { hunterId } = context.params;

  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required" },
      { status: 400 },
    );
  }

  try {
    // Use the existing server service function to fetch the hunter.
    // This now includes inventory and equipment data fetched from the database.
    const hunter = await getHunterById(hunterId);

    if (!hunter) {
      return NextResponse.json(
        { error: "Hunter not found or access denied" },
        { status: 404 },
      );
    }

    // Return the hunter data directly (it already includes inventory/equipment)
    return NextResponse.json({ hunter: hunter });
  } catch (error: any) {
    console.error(`API Error fetching hunter ${hunterId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch hunter data" },
      { status: 500 },
    );
  }
}
