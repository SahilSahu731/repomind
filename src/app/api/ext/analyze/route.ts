import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getApiError } from "@/lib/errors";
import { enqueueAnalyzeRepoJob } from "@/lib/queue";
import { limitAnalyze } from "@/lib/ratelimit";
import { corsHeaders, corsOk, withCors } from "@/lib/cors";
import {
  createJob,
  createRepo,
  ensureUserExists,
  getRepoByGithubUrlAndBranch,
  getUserById,
} from "@/lib/supabaseDb";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const error = getApiError("UNAUTHORIZED");
      return withCors(
        { success: false, error: { code: error.code, message: error.message } },
        origin,
        error.status
      );
    }

    const body = await req.json();
    const { owner, repo, branch, githubUrl, metadata } = body as {
      owner: string;
      repo: string;
      branch: string;
      githubUrl: string;
      metadata?: Record<string, unknown>;
    };

    if (!owner || !repo || !githubUrl) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Missing owner, repo, or githubUrl" } },
        origin,
        400
      );
    }

    // Normalize the GitHub URL
    const normalizedUrl = `https://github.com/${owner}/${repo}`;
    const resolvedBranch = branch || "main";

    // Ensure user is seeded in Supabase
    await ensureUserExists({
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      githubUsername: session.user.githubUsername ?? null,
      plan: session.user.plan,
      creditsRemaining: session.user.creditsRemaining,
    });

    // Check cache — existing completed analysis
    const cached = await getRepoByGithubUrlAndBranch(normalizedUrl, resolvedBranch);
    if (
      cached &&
      cached.status === "COMPLETE" &&
      cached.expiresAt &&
      new Date(cached.expiresAt) > new Date()
    ) {
      return withCors(
        { success: true, data: { cached: true, repoId: cached.id, jobId: "" } },
        origin
      );
    }

    // Credit / rate-limit checks
    const user = await getUserById(session.user.id);
    const plan = user?.plan ?? session.user.plan;
    const credits = user?.creditsRemaining ?? session.user.creditsRemaining;

    if (plan === "FREE" && credits <= 0) {
      return withCors(
        { success: false, error: { code: "CREDITS_EXHAUSTED", message: "No credits remaining" } },
        origin,
        402
      );
    }

    const allowed = await limitAnalyze(`user:${session.user.id}`, plan !== "FREE");
    if (!allowed) {
      return withCors(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
        origin,
        429
      );
    }

    // Create repo + job + enqueue
    const repoRow = await createRepo({
      userId: session.user.id,
      githubUrl: normalizedUrl,
      owner,
      name: repo,
      branch: resolvedBranch,
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
      githubUrl: normalizedUrl,
      owner,
      repo,
      branch: resolvedBranch,
    });

    return withCors(
      { success: true, data: { jobId: jobRow.id, repoId: repoRow.id, cached: false } },
      origin,
      202
    );
  } catch (error: unknown) {
    console.error("[ext/analyze] Error:", error);
    return withCors(
      { success: false, error: { code: "ANALYSIS_FAILED", message: "Failed to start analysis" } },
      origin,
      500
    );
  }
}
