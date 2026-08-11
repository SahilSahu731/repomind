import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { listReposByUser } from "@/lib/supabaseDb";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const error = getApiError("UNAUTHORIZED");
      return fail(error.code, error.message, error.status);
    }

    const searchParams = req.nextUrl.searchParams;
    const requestedPage = Number(searchParams.get("page") ?? 1);
    const requestedLimit = Number(searchParams.get("limit") ?? 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(50, Math.max(1, Math.floor(requestedLimit)))
      : 10;
    const status = searchParams.get("status") ?? "all";
    const allowedStatuses = new Set([
      "all",
      "QUEUED",
      "CLONING",
      "PARSING",
      "ANALYZING",
      "COMPLETE",
      "FAILED",
    ]);

    if (!allowedStatuses.has(status)) {
      const error = getApiError("INVALID_INPUT", "Unknown repository status filter");
      return fail(error.code, error.message, error.status);
    }

    const { repos, total } = await listReposByUser(session.user.id, page, limit, status);

    return ok({
      repos,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch {
    const error = getApiError(
      "ANALYSIS_FAILED",
      "Your repository workspace could not be loaded"
    );
    return fail(error.code, error.message, error.status);
  }
}
