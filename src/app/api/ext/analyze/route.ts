import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { getApiError } from "@/lib/errors";
import { getExtensionPrincipal } from "@/lib/extensionAuth";
import { enqueueAnalyzeRepoJob } from "@/lib/queue";
import { limitAnalyze } from "@/lib/ratelimit";
import { corsOk, rejectDisallowedCorsOrigin, withCors } from "@/lib/cors";
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

export const maxDuration = 300;

const ACTIVE_JOB_TIMEOUT_MS = 15 * 60 * 1000;
const REPO_PART_PATTERN = /^[\w.-]+$/;
const BRANCH_PATTERN = /^[\w./-]+$/;

function isActiveJobFresh(updatedAt: string | undefined, createdAt: string): boolean {
  const timestamp = new Date(updatedAt ?? createdAt).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp < ACTIVE_JOB_TIMEOUT_MS;
}

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const originRejection = rejectDisallowedCorsOrigin(origin);
  if (originRejection) return originRejection;

  try {
    const principal = await getExtensionPrincipal(req);
    if (!principal) {
      const error = getApiError("UNAUTHORIZED");
      return withCors(
        { success: false, error: { code: error.code, message: error.message } },
        origin,
        error.status
      );
    }

    const body = await req.json();
    const owner = typeof body?.owner === "string" ? body.owner.trim() : "";
    const repo = typeof body?.repo === "string"
      ? body.repo.trim().replace(/\.git$/i, "")
      : "";
    const branch = typeof body?.branch === "string" && body.branch.trim()
      ? body.branch.trim()
      : "HEAD";

    if (
      !REPO_PART_PATTERN.test(owner) ||
      !REPO_PART_PATTERN.test(repo) ||
      !BRANCH_PATTERN.test(branch) ||
      branch.length > 255
    ) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Enter a valid public GitHub repository" } },
        origin,
        400
      );
    }

    const normalizedUrl = `https://github.com/${owner}/${repo}`;

    await ensureUserExists({
      id: principal.id,
      email: principal.email,
      name: principal.name,
      image: principal.image,
      githubUsername: principal.githubUsername,
      plan: principal.plan,
      creditsRemaining: principal.creditsRemaining,
    });

    const cached = await getRepoByGithubUrlAndBranch(
      normalizedUrl,
      branch,
      principal.id
    );

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

    if (cached && !["COMPLETE", "FAILED"].includes(cached.status)) {
      const existingJob = await getLatestJobByRepoId(cached.id);

      if (existingJob && isActiveJobFresh(existingJob.updatedAt, existingJob.createdAt)) {
        return withCors(
          {
            success: true,
            data: {
              cached: false,
              alreadyRunning: true,
              repoId: cached.id,
              jobId: existingJob.id,
            },
          },
          origin,
          202
        );
      }

      const staleMessage = "Previous analysis stopped before completion and was replaced.";
      await Promise.all([
        updateRepo(cached.id, { status: "FAILED", errorMessage: staleMessage }),
        existingJob
          ? updateJob(existingJob.id, {
              status: "FAILED",
              progress: 0,
              currentStep: "failed",
              errorLog: staleMessage,
              completedAt: new Date().toISOString(),
            })
          : Promise.resolve(),
      ]);
    }

    const storedUser = await getUserById(principal.id);
    const plan = storedUser?.plan ?? principal.plan;
    const credits = storedUser?.creditsRemaining ?? principal.creditsRemaining;

    if (plan === "FREE" && credits <= 0) {
      return withCors(
        { success: false, error: { code: "CREDITS_EXHAUSTED", message: "No analysis credits remaining" } },
        origin,
        402
      );
    }

    const allowed = await limitAnalyze(`user:${principal.id}`, plan !== "FREE");
    if (!allowed) {
      return withCors(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many analysis requests. Try again shortly." } },
        origin,
        429
      );
    }

    const repoRow = await createRepo({
      userId: principal.id,
      githubUrl: normalizedUrl,
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
        githubUrl: normalizedUrl,
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
