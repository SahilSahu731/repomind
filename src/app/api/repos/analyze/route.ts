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
  getLatestJobByRepoId,
  getRepoByGithubUrlAndBranch,
  getUserById,
  updateJob,
  updateRepo,
} from "@/lib/supabaseDb";
import { analyzeSchema } from "@/lib/validations/repo";

function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  branch: string;
  cloneUrl: string;
} {
  const regex = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w./-]+))?$/;
  const match = url.match(regex);
  if (!match) {
    throw new Error("INVALID_URL");
  }

  const repo = match[2].replace(/\.git$/i, "");

  return {
    owner: match[1],
    repo,
    branch: match[3] ?? "HEAD",
    cloneUrl: `https://github.com/${match[1]}/${repo}`,
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

    const { owner, repo, branch, cloneUrl } = parseGitHubUrl(parsed.data.githubUrl);

    await ensureUserExists({
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      githubUsername: session.user.githubUsername ?? null,
      plan: session.user.plan,
      creditsRemaining: session.user.creditsRemaining,
    });

    const storedUser = await getUserById(session.user.id);
    const user = storedUser ?? {
      id: session.user.id,
      plan: session.user.plan,
      creditsRemaining: session.user.creditsRemaining,
    };

    if (user.plan === "FREE" && user.creditsRemaining <= 0) {
      const error = getApiError("CREDITS_EXHAUSTED");
      return fail(error.code, error.message, error.status);
    }

    const cached = await getRepoByGithubUrlAndBranch(cloneUrl, branch, user.id);

    if (
      cached &&
      cached.status === "COMPLETE" &&
      cached.expiresAt &&
      new Date(cached.expiresAt) > new Date()
    ) {
      return ok({ cached: true, repoId: cached.id });
    }

    if (cached && !["COMPLETE", "FAILED"].includes(cached.status)) {
      const existingJob = await getLatestJobByRepoId(cached.id);
      return ok(
        {
          alreadyRunning: true,
          repoId: cached.id,
          jobId: existingJob?.id,
        },
        202
      );
    }

    const success = await limitAnalyze(`user:${user.id}`, user.plan !== "FREE");
    if (!success) {
      const error = getApiError("RATE_LIMITED");
      return fail(error.code, error.message, error.status);
    }

    const repoRow = await createRepo({
      userId: user.id,
      githubUrl: cloneUrl,
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

    try {
      await enqueueAnalyzeRepoJob({
        repoId: repoRow.id,
        jobId: jobRow.id,
        githubUrl: cloneUrl,
        owner,
        repo,
        branch,
      });
    } catch (queueError: unknown) {
      const message = queueError instanceof Error
        ? queueError.message
        : "The analysis worker could not accept this job";

      await Promise.all([
        updateRepo(repoRow.id, { status: "FAILED", errorMessage: message }),
        updateJob(jobRow.id, {
          status: "FAILED",
          progress: 0,
          currentStep: "failed",
          errorLog: message,
          completedAt: new Date().toISOString(),
        }),
      ]);
      throw queueError;
    }

    return ok({ jobId: jobRow.id, repoId: repoRow.id }, 202);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("PGRST205")) {
      const dbError = getApiError(
        "HEALTH_CHECK_FAILED",
        "Database tables are missing in Supabase. Create required tables: User/users, Repo/repos, Job/jobs, AnalysisResult/analysis_results."
      );
      return fail(dbError.code, dbError.message, dbError.status);
    }

    const message = error instanceof Error && error.message === "INVALID_URL"
      ? "Enter a valid public GitHub repository URL"
      : undefined;
    const analysisError = getApiError(message ? "INVALID_URL" : "ANALYSIS_FAILED", message);
    return fail(analysisError.code, analysisError.message, analysisError.status);
  }
}
