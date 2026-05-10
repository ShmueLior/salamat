import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth_token')?.value;
  const householdId = request.cookies.get('household_id')?.value;

  const isLogin = pathname === '/login';
  const isOnboarding = pathname === '/onboarding';

  // Unauthenticated — only /login is allowed
  if (!token) {
    if (isLogin) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated but no list yet — only /onboarding is allowed
  if (!householdId) {
    if (isOnboarding) return NextResponse.next();
    if (isLogin) return NextResponse.redirect(new URL('/onboarding', request.url));
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Fully authenticated — bounce away from login/onboarding
  if (isLogin || isOnboarding) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|icons).*)'],
};
