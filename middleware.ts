import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('supabase-auth-token');
  const pathname = request.nextUrl.pathname;
  
  // Protect game routes
  if (pathname.startsWith('/(game)') && !currentUser) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect logged in users from auth pages to dashboard
  if ((pathname === '/login' || pathname === '/register') && currentUser) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 