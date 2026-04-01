import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { listReposByUser } from "@/lib/supabaseDb";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const error = getApiError("UNAUTHORIZED");
    return fail(error.code, error.message, error.status);
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const status = searchParams.get("status") ?? "all";

  const { repos, total } = await listReposByUser(session.user.id, page, limit, status);

  return ok({
    repos,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
