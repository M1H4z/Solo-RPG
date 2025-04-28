import { NextResponse } from "next/server";
import { getUserSession } from "@/services/authService";
import { allocateStatPoint } from "@/services/hunterService"; // Import the service function

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { hunterId: string };
}

// Define valid stat names - could potentially be shared from constants
const VALID_STATS = [
  "strength",
  "agility",
  "perception",
  "intelligence",
  "vitality",
];

// POST handler to allocate a single stat point using the service layer
export async function POST(request: Request, context: RouteContext) {
  const { hunterId } = context.params;
  const session = await getUserSession(); // Still need session check here for authorization context

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
      throw new Error("Invalid or missing stat name provided.");
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body. Expecting { "statName": string }.' },
      { status: 400 },
    );
  }

  try {
    // Call the service function to handle the allocation logic
    const result = await allocateStatPoint(hunterId, statToAllocate);

    if (!result.success) {
      // Determine appropriate status code based on error message
      let statusCode = 500;
      if (result.error === "Unauthorized") {
        statusCode = 401;
      } else if (result.error?.includes("not found")) {
        statusCode = 404;
      } else if (result.error?.includes("No stat points")) {
        statusCode = 400;
      }
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    // Return the successful response from the service, including the updated hunter
    return NextResponse.json({
        message: result.message,
        updatedHunter: result.updatedHunter // Pass the updated hunter object
    }, { status: 200 });

  } catch (error: any) {
    // Catch unexpected errors during service call or response handling
    console.error(`API Error allocating stat for hunter ${hunterId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to allocate stat point due to an unexpected server error." },
      { status: 500 },
    );
  }
}
