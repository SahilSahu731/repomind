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

function isAllowedOrigin(origin: string | null): boolean {
  return origin === null || allowedOrigins.has(origin.replace(/\/$/, ""));
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
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed" } },
      { status: 403, headers: { Vary: "Origin" } }
    );
  }

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
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed" } },
      { status: 403, headers: { Vary: "Origin" } }
    );
  }

  return NextResponse.json(json, {
    status,
    headers: corsHeaders(origin),
  });
}
