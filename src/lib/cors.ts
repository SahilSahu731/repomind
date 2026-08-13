import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const configuredOrigins = (env.EXTENSION_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const siteOrigin = new URL(env.NEXTAUTH_URL).origin;
const developmentOrigins = env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

const allowedOrigins = new Set([siteOrigin, ...configuredOrigins, ...developmentOrigins]);

const extensionOriginPattern = /^chrome-extension:\/\/[a-p]{32}$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (origin === null) return true;

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (allowedOrigins.has(normalizedOrigin)) return true;

  return env.NODE_ENV !== "production" && extensionOriginPattern.test(normalizedOrigin);
}

export function rejectDisallowedCorsOrigin(origin: string | null): NextResponse | null {
  if (isAllowedOrigin(origin)) return null;

  return NextResponse.json(
    { success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed" } },
    { status: 403, headers: { Vary: "Origin" } }
  );
}

export function isAllowedExtensionOrigin(origin: string): boolean {
  const normalizedOrigin = origin.replace(/\/$/, "");
  return extensionOriginPattern.test(normalizedOrigin) && (
    configuredOrigins.includes(normalizedOrigin) ||
    env.NODE_ENV !== "production"
  );
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function corsOk(origin: string | null): NextResponse {
  const rejection = rejectDisallowedCorsOrigin(origin);
  if (rejection) return rejection;

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export function withCors<T>(
  json: { success: boolean; data?: T; error?: unknown },
  origin: string | null,
  status = 200
): NextResponse {
  const rejection = rejectDisallowedCorsOrigin(origin);
  if (rejection) return rejection;

  return NextResponse.json(json, {
    status,
    headers: corsHeaders(origin),
  });
}
