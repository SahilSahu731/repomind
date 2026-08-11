import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { limitGlobal } from "@/lib/ratelimit";

const PUBLIC_PATHS = ["/", "/privacy", "/terms", "/data-controls", "/support", "/share"];
const AUTH_PATHS = ["/login", "/signup"];
const USER_ROOT = "/user";
const PUBLIC_API = ["/api/auth", "/api/webhooks", "/api/health"];
const PUBLIC_METADATA = ["/robots.txt", "/sitemap.xml"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && pathname !== "/api/health") {
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const identifier = req.headers.get("x-real-ip") ?? forwardedFor ?? "unknown-client";

    try {
      const allowed = await limitGlobal(`ip:${identifier}`);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
          { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMIT_UNAVAILABLE", message: "Request protection is temporarily unavailable" } },
        { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } }
      );
    }
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_METADATA.includes(pathname) ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = Boolean(token);

  if (isAuthenticated && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith(USER_ROOT)) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  if (pathname === USER_ROOT) {
    return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
