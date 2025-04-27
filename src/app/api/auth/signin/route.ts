import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createSupabaseRouteHandlerClient();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in API error:', error);
      // Don't expose detailed auth errors to the client generally
      return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 400 });
    }

    // Successful sign-in, session is set via cookies by the helper
    return NextResponse.json({ 
      message: 'Signin successful',
      session: data.session // contains user info
     }, { status: 200 });

  } catch (error) {
    console.error('Unexpected signin API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signin.' },
      { status: 500 }
    );
  }
} 