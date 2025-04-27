// No longer using Server Actions for signup/signin/signout
// 'use server'; 

import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Import the generic server helper

// NOTE: The actual signup/signin/signout logic now resides in /api/auth routes

// Function to get the current user session on the server (e.g., in Server Components)
export async function getUserSession() {
  // Use the generic server client helper
  const supabase = createSupabaseServerClient(); 
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
     console.error('Error getting session:', error);
     return null;
  }
}

// Function to get the user profile data from public.users
export async function getUserProfile() {
  const session = await getUserSession();
  if (!session?.user) return null;

  // Use the generic server client helper
  const supabase = createSupabaseServerClient(); 
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, country')
    .eq('auth_id', session.user.id)
    .single();

  // PGRST116: No rows found - expected if profile fetch happens before trigger creates it
  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching user profile:', error.message);
    return null;
  }

  return data;
} 