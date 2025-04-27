import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client-side singleton to prevent multiple instances during hot reload
export const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: create a new client
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  // Client-side: return the existing client
  return supabase;
}; 