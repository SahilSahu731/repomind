import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { corsOk, withCors } from "@/lib/cors";
import { getUserById } from "@/lib/supabaseDb";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return withCors(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        origin,
        401
      );
    }

    // Get fresh user data from DB
    const dbUser = await getUserById(session.user.id);

    return withCors(
      {
        success: true,
        data: {
          id: session.user.id,
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          image: session.user.image ?? "",
          plan: dbUser?.plan ?? session.user.plan ?? "FREE",
          creditsRemaining: dbUser?.creditsRemaining ?? session.user.creditsRemaining ?? 3,
          githubUsername: session.user.githubUsername ?? "",
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
