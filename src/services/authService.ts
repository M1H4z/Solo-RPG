// No longer using Server Actions for signup/signin/signout
// 'use server';

import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // Import the generic server helper
import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient type

// NOTE: The actual signup/signin/signout logic now resides in /api/auth routes

// Function to get the current user session on the server (e.g., in Server Components)
export async function getUserSession(supabaseClient?: SupabaseClient<Database>) {
  // Use the provided client if available, otherwise create one (though this shouldn't happen in the server component flow)
  const supabase = supabaseClient || createSupabaseServerClient();
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Function to get the user profile data from public.users
export async function getUserProfile(supabaseClient?: SupabaseClient<Database>) {
  // Pass the client down to getUserSession
  const session = await getUserSession(supabaseClient);
  if (!session?.user) return null;

  // Use the provided client if available, otherwise create one
  const supabase = supabaseClient || createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, country")
    .eq("auth_id", session.user.id)
    .single();

  // PGRST116: No rows found - expected if profile fetch happens before trigger creates it
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error.message);
    return null;
  }

  return data;
}
