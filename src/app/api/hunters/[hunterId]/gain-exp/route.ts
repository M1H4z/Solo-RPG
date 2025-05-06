import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/services/authService";
import { gainExperience } from "@/services/hunterService"; // Import the service function

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { hunterId: string };
}

// POST handler to add experience using the service layer
export async function POST(request: Request, context: RouteContext) {
  const { hunterId } = context.params;
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required" },
      { status: 400 },
    );
  }

  let experienceGained: number;
  try {
    const body = await request.json();
    experienceGained = parseInt(body.experienceGained, 10);
    // Validate the amount (positive integer)
    if (isNaN(experienceGained) || experienceGained <= 0 || !Number.isInteger(experienceGained)) {
        throw new Error("Invalid or non-positive integer experience amount provided.");
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message || 'Invalid request body. Expecting { "experienceGained": number }.',
      },
      { status: 400 },
    );
  }

  try {
    // Call the service function to handle the logic
    const result = await gainExperience(hunterId, experienceGained);

    if (!result.success) {
        // Determine appropriate status code based on error
        let statusCode = 500;
        if (result.error === "Unauthorized") {
            statusCode = 401;
        } else if (result.error?.includes("not found")) {
            statusCode = 404;
        } else if (result.error?.includes("required")) {
            statusCode = 400;
        }
        return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    // Return the successful response from the service,
    // including the updated hunter and level up details
    return NextResponse.json({
        message: result.message,
        updatedHunter: result.updatedHunter, // Crucial part!
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        levelsGained: result.levelsGained,
        statPointsGained: result.statPointsGained,
        skillPointsGained: result.skillPointsGained,
    }, { status: 200 });

  } catch (error: any) {
    // Catch unexpected errors during service call or response handling
    console.error(`API Error gaining EXP for hunter ${hunterId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to process experience gain due to an unexpected server error." },
      { status: 500 },
    );
  }
}
