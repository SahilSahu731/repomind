import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { limitGlobal } from "@/lib/ratelimit";

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

  if (pathname === "/user") {
    return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
