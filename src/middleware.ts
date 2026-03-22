import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  // Lightweight check for NextAuth session cookies to avoid Edge Runtime Node.js imports
  const hasToken = req.cookies.has("authjs.session-token") || 
                   req.cookies.has("__Secure-authjs.session-token") || 
                   req.cookies.has("next-auth.session-token") || 
                   req.cookies.has("__Secure-next-auth.session-token");

  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  if (isAuthRoute) {
    if (hasToken) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!hasToken) {
      return NextResponse.redirect(new URL("/auth", nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
