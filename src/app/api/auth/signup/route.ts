import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const country = formData.get("country") as string;
  const supabase = createSupabaseRouteHandlerClient();

  // Basic validation
  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Email, password, and username are required." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          country: country || null,
        },
        // Ensure this matches your Supabase Auth Email template settings
        // and the URL where users confirm their email
        // emailRedirectTo: `${requestUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Sign up API error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Success - user might need to confirm email
    return NextResponse.json(
      {
        message: "Signup successful, please check your email for confirmation.",
        user: data.user, // Can be null if confirmation needed
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected signup API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup." },
      { status: 500 },
    );
  }
}
