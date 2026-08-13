import type { NextRequest } from "next/server";
import { corsOk, rejectDisallowedCorsOrigin, withCors } from "@/lib/cors";
import { getExtensionPrincipal } from "@/lib/extensionAuth";
import { getUserById } from "@/lib/supabaseDb";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const originRejection = rejectDisallowedCorsOrigin(origin);
  if (originRejection) return originRejection;

  try {
    const principal = await getExtensionPrincipal(req);

    if (!principal) {
      return withCors(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        origin,
        401
      );
    }

    // Get fresh user data from DB
    const dbUser = await getUserById(principal.id);

    return withCors(
      {
        success: true,
        data: {
          id: principal.id,
          name: principal.name ?? "",
          email: principal.email ?? "",
          image: principal.image ?? "",
          plan: dbUser?.plan ?? principal.plan,
          creditsRemaining: dbUser?.creditsRemaining ?? principal.creditsRemaining,
          githubUsername: principal.githubUsername ?? "",
        },
      },
      origin
    );
  } catch (error: unknown) {
    console.error("[ext/auth/me] Error:", error);
    return withCors(
      { success: false, error: { code: "INTERNAL", message: "Failed to get user" } },
      origin,
      500
    );
  }
}
