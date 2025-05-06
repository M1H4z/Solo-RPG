// No longer using Server Actions for signup/signin/signout
// 'use server';

import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // Import the generic server helper
import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient type

// NOTE: The actual signup/signin/signout logic now resides in /api/auth routes

// Function to get the current authenticated user on the server
export async function getAuthenticatedUser(supabaseClient?: SupabaseClient<Database>) {
  // Use the provided client if available, otherwise create one
  const supabase = supabaseClient || createSupabaseServerClient();
  try {
    const {
      data: { user }, // Get the user object directly
      error,
    } = await supabase.auth.getUser(); // Use getUser()
    if (error) throw error;
    return user; // Return the user object
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

// Function to get the user profile data from public.users
export async function getUserProfile(supabaseClient?: SupabaseClient<Database>) {
  // Get the authenticated user instead of the session
  const user = await getAuthenticatedUser(supabaseClient);
  if (!user) return null; // Check if user exists

  // Use the provided client if available, otherwise create one
  const supabase = supabaseClient || createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, country")
    .eq("auth_id", user.id) // Use user.id
    .single();

  // PGRST116: No rows found - expected if profile fetch happens before trigger creates it
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error.message);
    return null;
  }

  return data;
}
