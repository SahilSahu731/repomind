import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "chrome-extension://",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((prefix) => origin.startsWith(prefix));
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function corsOk(origin: string | null): NextResponse {
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
  return NextResponse.json(json, {
    status,
    headers: corsHeaders(origin),
  });
}
