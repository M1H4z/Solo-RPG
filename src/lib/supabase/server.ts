import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// Utility for Server Components, Server Actions, Route Handlers
// NOTE: Different contexts might require slight variations if cookies()
// or req/res objects are handled differently.

// Primarily for Server Components & Server Actions
export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Server Actions/Components might try to set cookies, which might raise an error
          // if called outside the writable context (e.g., not in a Route Handler or Middleware response).
          // If using primarily for reading session, this might be okay.
          // For writes (like signin/signup/signout), prefer Route Handlers.
          try {
             cookieStore.set({ name, value, ...options });
          } catch (error) {
             // Ignore errors when trying to set cookies from non-writable contexts
             console.warn('Attempted to set cookie in read-only context', name);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
             cookieStore.set({ name, value: '', ...options });
          } catch (error) {
             console.warn('Attempted to remove cookie in read-only context', name);
          }
        },
      },
    }
  );
};

// Explicitly for Route Handlers (where setting cookies is guaranteed to work)
// Note: Route Handlers receive `req` but cookies() works directly here too.
export const createSupabaseRouteHandlerClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}; 