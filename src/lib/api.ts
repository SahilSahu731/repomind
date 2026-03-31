import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}
