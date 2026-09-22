import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { limitGlobal } from "@/lib/ratelimit";

const AUTH_PAGES = new Set(["/login"]);
const NEXTAUTH_API_ACTIONS = [
  "/api/auth/callback",
  "/api/auth/csrf",
  "/api/auth/error",
  "/api/auth/providers",
  "/api/auth/session",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/verify-request",
];

function isNextAuthApi(pathname: string): boolean {
  return NEXTAUTH_API_ACTIONS.some(
    (action) => pathname === action || pathname.startsWith(`${action}/`)
  );
}

function isUserPage(pathname: string): boolean {
  return pathname === "/user" || pathname.startsWith("/user/");
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  return response;
}

function clearLegacyAuthCookies(response: NextResponse): NextResponse {
  for (const name of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
  ]) {
    response.cookies.delete(name);
  }

  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // OAuth callbacks, CSRF, and session refreshes must remain available even if
  // the distributed rate limiter is unavailable. NextAuth protects its own
  // state-changing requests with CSRF/state cookies.
  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/health" &&
    pathname !== "/api/github/webhook" &&
    !isNextAuthApi(pathname)
  ) {
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

  const isAuthPage = AUTH_PAGES.has(pathname);
  const isProtectedUserPage = isUserPage(pathname);

  if (isAuthPage || isProtectedUserPage) {
    const token = await getToken({
      req,
      secret: env.NEXTAUTH_SECRET,
    });
    const isAuthenticated = Boolean(token?.id && token?.githubUserId);
    const hasLegacySession = Boolean(token && !isAuthenticated);

    if (isAuthPage && isAuthenticated) {
      return noStore(NextResponse.redirect(new URL("/user/dashboard", req.url)));
    }

    if (isProtectedUserPage && !isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      const response = noStore(NextResponse.redirect(loginUrl));
      return hasLegacySession ? clearLegacyAuthCookies(response) : response;
    }

    if (pathname === "/user") {
      return noStore(NextResponse.redirect(new URL("/user/dashboard", req.url)));
    }

    const response = noStore(NextResponse.next());
    return hasLegacySession ? clearLegacyAuthCookies(response) : response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
