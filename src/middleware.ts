import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration: Paths that are explicitly public or auth routes
const LOGIN_PATH = '/admin/login';
const DASHBOARD_PATH = '/admin/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply logic to routes starting with /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Retrieve auth token from cookies
  const authToken = request.cookies.get('pb_auth')?.value;
  const isAuthenticated = Boolean(authToken && authToken.trim().length > 0);

  const isLoginPage = pathname === LOGIN_PATH;

  // 1. If user is NOT authenticated and trying to access any protected /admin route (except login)
  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    // Optionally preserve the attempted path as a callback
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user IS authenticated and visits /admin/login, redirect to /admin/dashboard
  if (isAuthenticated && isLoginPage) {
    const dashboardUrl = new URL(DASHBOARD_PATH, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
