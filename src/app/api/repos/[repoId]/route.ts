import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import {
  getAnalysisResultByRepoId,
  getLatestJobByRepoId,
  getRepoByIdForUser,
} from "@/lib/supabaseDb";

interface RepoRouteContext {
  params: Promise<{ repoId: string }> | { repoId: string };
}

export async function GET(_req: NextRequest, ctx: RepoRouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const error = getApiError("UNAUTHORIZED");
    return fail(error.code, error.message, error.status);
  }

  const { repoId } = await Promise.resolve(ctx.params);

  const repo = await getRepoByIdForUser(repoId, session.user.id);
  if (!repo) {
    const error = getApiError("REPO_NOT_FOUND");
    return fail(error.code, error.message, error.status);
  }

  const [analysisResult, latestJob] = await Promise.all([
    getAnalysisResultByRepoId(repoId),
    getLatestJobByRepoId(repoId),
  ]);

  return ok({
    repo,
    analysisResult,
    job: latestJob,
  });
}
