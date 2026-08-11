import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { getUserById } from "@/lib/supabaseDb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const error = getApiError("UNAUTHORIZED");
    return fail(error.code, error.message, error.status);
  }

  const storedUser = await getUserById(session.user.id);

  return ok({
    plan: storedUser?.plan ?? session.user.plan,
    creditsRemaining: storedUser?.creditsRemaining ?? session.user.creditsRemaining,
  });
}
