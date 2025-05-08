import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/services/authService";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { walletAddress } = await request.json();
  if (!walletAddress) {
    return NextResponse.json({ error: "No wallet address provided" }, { status: 400 });
  }

  const supabase = createSupabaseRouteHandlerClient();
  const { error } = await supabase
    .from("users")
    .update({ wallet_address: walletAddress })
    .eq("auth_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 