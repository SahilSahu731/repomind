import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  isValidExtensionState,
  validateExtensionId,
  validateExtensionRedirectUri,
} from "@/lib/extensionAuth";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const isTabFlow = req.nextUrl.searchParams.get("flow") === "tab";
  const extensionId = isTabFlow
    ? validateExtensionId(req.nextUrl.searchParams.get("extension_id"))
    : null;
  const redirectUri = validateExtensionRedirectUri(
    req.nextUrl.searchParams.get("redirect_uri")
  );

  if (!isValidExtensionState(state) || (isTabFlow ? !extensionId : !redirectUri)) {
    return Response.json(
      { success: false, error: "Invalid extension authentication request" },
      { status: 400 }
    );
  }

  const callbackUrl = new URL("/api/ext/auth/callback", env.NEXTAUTH_URL);
  callbackUrl.searchParams.set("state", state);
  if (isTabFlow && extensionId) {
    callbackUrl.searchParams.set("flow", "tab");
    callbackUrl.searchParams.set("extension_id", extensionId);
  } else if (redirectUri) {
    callbackUrl.searchParams.set("redirect_uri", redirectUri.toString());
  }

  const loginUrl = new URL("/login", env.NEXTAUTH_URL);
  loginUrl.searchParams.set("callbackUrl", callbackUrl.toString());

  return Response.redirect(loginUrl, 302);
}
