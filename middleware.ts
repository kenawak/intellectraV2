import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Middleware for route protection
 * Uses cookie-based check (Edge Runtime compatible)
 * Full session verification happens client-side via AuthGuard
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (Edge Runtime compatible)
  // Note: This is a lightweight check. Full session verification
  // happens client-side via AuthGuard component
  const sessionCookie = getSessionCookie(request);

  // If no session cookie and trying to access /dashboard, redirect to /login
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If session cookie exists and on root page, redirect to /dashboard
  // NOTE: We don't redirect from /login here because the cookie might be stale/invalid.
  // The AuthGuard will handle redirecting authenticated users from login page.
  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*", "/pricing", "/onboarding"], // Apply to root, login, signup, dashboard, pricing, and onboarding routes
};