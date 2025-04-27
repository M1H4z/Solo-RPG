import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';

// Force dynamic to ensure cookies are always read/written correctly
export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Successful sign-out
    return NextResponse.json({ message: 'Signout successful' }, { status: 200 });

  } catch (error) {
    console.error('Unexpected signout API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signout.' },
      { status: 500 }
    );
  }
} 