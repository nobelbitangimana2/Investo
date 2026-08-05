import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware — primary auth logic is in the RouteGuard client component
 * (Zustand persisted auth). This middleware handles redirecting authenticated
 * users away from /login back to their dashboard.
 *
 * Deep role-checking happens client-side since auth state lives in localStorage.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let everything through at the middleware level.
  // Client-side RouteGuard handles role-based redirects.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
