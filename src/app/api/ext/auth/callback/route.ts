import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  isValidExtensionState,
  issueExtensionToken,
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
      { success: false, error: "Invalid extension authentication callback" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", env.NEXTAUTH_URL);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.toString());
    return Response.redirect(loginUrl, 302);
  }

  const token = await issueExtensionToken({
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    githubUsername: session.user.githubUsername ?? null,
    plan: session.user.plan,
    creditsRemaining: session.user.creditsRemaining,
  });

  const destination = isTabFlow
    ? new URL("/api/ext/auth/complete", env.NEXTAUTH_URL)
    : redirectUri;
  if (!destination) {
    return Response.json({ success: false, error: "Invalid extension callback" }, { status: 400 });
  }
  destination.hash = new URLSearchParams({ token, state }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.toString(),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
