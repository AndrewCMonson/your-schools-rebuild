import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AUTH_SECRET } from "@/lib/auth/constants";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: AUTH_SECRET });

  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/profile") || pathname.startsWith("/admin") || pathname.startsWith("/portal");

  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/schools", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/portal/:path*"],
};
