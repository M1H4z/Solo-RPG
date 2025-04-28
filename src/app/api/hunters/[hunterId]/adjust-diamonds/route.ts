import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const adjustSchema = z.object({
  amount: z.number().int(), // Amount can be positive or negative
});

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } },
) {
  const cookieStore = cookies();
  const supabase = createSupabaseRouteHandlerClient();
  const hunterId = params.hunterId;

  // 1. Check Authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. Validate Input
  let inputData;
  try {
    const rawData = await request.json();
    inputData = adjustSchema.parse(rawData);
  } catch (error) {
    console.error("Invalid adjust diamonds input:", error);
    return NextResponse.json(
      { error: "Invalid input data", details: error },
      { status: 400 },
    );
  }

  const { amount } = inputData;

  if (!hunterId) {
    return NextResponse.json({ error: "Hunter ID is required." }, { status: 400 });
  }

  // 3. Call the Database Function
  try {
    const { data, error: rpcError } = await supabase.rpc(
      "adjust_hunter_diamonds", // Call the new function
      {
        p_hunter_id: hunterId,
        p_user_id: userId,
        p_amount: amount,
      },
    );

    if (rpcError) {
      console.error("RPC Error adjusting diamonds:", rpcError);
      throw new Error("Database error during diamond adjustment.");
    }

    // The RPC function returns JSON {success: boolean, error?: string, ...}
    if (data && !data.success) {
      // Specific error message from the DB function
      return NextResponse.json(
        { error: data.error || "Diamond adjustment failed" },
        { status: 400 }, // Use 400 for known failures
      );
    }

    if (!data || !data.success) {
      // Catch-all for unexpected non-success returns
      return NextResponse.json(
        { error: "Diamond adjustment failed for an unknown reason." },
        { status: 500 },
      );
    }

    // 4. Return Success Response from DB function
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("API Error adjusting diamonds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process diamond adjustment request" },
      { status: 500 },
    );
  }
} 