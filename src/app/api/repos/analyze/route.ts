import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { enqueueAnalyzeRepoJob } from "@/lib/queue";
import { limitAnalyze } from "@/lib/ratelimit";
import {
  createJob,
  createRepo,
  ensureUserExists,
  getRepoByGithubUrlAndBranch,
  getUserById,
} from "@/lib/supabaseDb";
import { analyzeSchema } from "@/lib/validations/repo";

function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string } {
  const regex = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w./-]+))?$/;
  const match = url.match(regex);
  if (!match) {
    throw new Error("INVALID_URL");
  }

  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] ?? "main",
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const error = getApiError("UNAUTHORIZED");
      return fail(error.code, error.message, error.status);
    }

    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      const error = getApiError(
        "INVALID_URL",
        parsed.error.issues[0]?.message ?? "Invalid URL"
      );
      return fail(error.code, error.message, error.status);
    }

    const { owner, repo, branch } = parseGitHubUrl(parsed.data.githubUrl);

    await ensureUserExists({
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      githubUsername: session.user.githubUsername ?? null,
      plan: session.user.plan,
      creditsRemaining: session.user.creditsRemaining,
    });

    const user = await getUserById(session.user.id);
    if (!user) {
      const fallbackUser = {
        id: session.user.id,
        plan: session.user.plan,
        creditsRemaining: session.user.creditsRemaining,
      };

      if (fallbackUser.plan === "FREE" && fallbackUser.creditsRemaining <= 0) {
        const creditError = getApiError("CREDITS_EXHAUSTED");
        return fail(creditError.code, creditError.message, creditError.status);
      }

      const success = await limitAnalyze(`user:${fallbackUser.id}`, fallbackUser.plan !== "FREE");
      if (!success) {
        const limitError = getApiError("RATE_LIMITED");
        return fail(limitError.code, limitError.message, limitError.status);
      }

      const repoRow = await createRepo({
        userId: fallbackUser.id,
        githubUrl: parsed.data.githubUrl,
        owner,
        name: repo,
        branch,
        status: "QUEUED",
        shareSlug: nanoid(10),
      });

      const jobRow = await createJob({
        repoId: repoRow.id,
        status: "QUEUED",
        progress: 0,
        currentStep: "queued",
      });

      await enqueueAnalyzeRepoJob({
        repoId: repoRow.id,
        jobId: jobRow.id,
        githubUrl: parsed.data.githubUrl,
        owner,
        repo,
        branch,
      });

      return ok({ jobId: jobRow.id, repoId: repoRow.id }, 202);
    }

    if (user.plan === "FREE" && user.creditsRemaining <= 0) {
      const error = getApiError("CREDITS_EXHAUSTED");
      return fail(error.code, error.message, error.status);
    }

    const cached = await getRepoByGithubUrlAndBranch(parsed.data.githubUrl, branch);

    if (
      cached &&
      cached.status === "COMPLETE" &&
      cached.expiresAt &&
      new Date(cached.expiresAt) > new Date()
    ) {
      return ok({ cached: true, repoId: cached.id });
    }

    const success = await limitAnalyze(`user:${user.id}`, user.plan !== "FREE");
    if (!success) {
      const error = getApiError("RATE_LIMITED");
      return fail(error.code, error.message, error.status);
    }

    const repoRow = await createRepo({
      userId: user.id,
      githubUrl: parsed.data.githubUrl,
      owner,
      name: repo,
      branch,
      status: "QUEUED",
      shareSlug: nanoid(10),
    });

    const jobRow = await createJob({
      repoId: repoRow.id,
      status: "QUEUED",
      progress: 0,
      currentStep: "queued",
    });

    await enqueueAnalyzeRepoJob({
      repoId: repoRow.id,
      jobId: jobRow.id,
      githubUrl: parsed.data.githubUrl,
      owner,
      repo,
      branch,
    });

    return ok({ jobId: jobRow.id, repoId: repoRow.id }, 202);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("PGRST205")) {
      const dbError = getApiError(
        "HEALTH_CHECK_FAILED",
        "Database tables are missing in Supabase. Create required tables: User/users, Repo/repos, Job/jobs, AnalysisResult/analysis_results."
      );
      return fail(dbError.code, dbError.message, dbError.status);
    }

    const analysisError = getApiError("ANALYSIS_FAILED");
    return fail(analysisError.code, analysisError.message, analysisError.status);
  }
}
