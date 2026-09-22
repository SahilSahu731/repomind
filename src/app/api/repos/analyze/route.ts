import {
  getServerSession,
} from "next-auth";

import {
  nanoid,
} from "nanoid";

import {
  authOptions,
} from "@/lib/auth";

import {
  fail,
  ok,
} from "@/lib/api";

import {
  getApiError,
} from "@/lib/errors";

import {
  userCanAccessGitHubRepository,
} from "@/lib/github/app";

import {
  getGitHubRepositoryForUser,
  getValidGitHubUserAccessToken,
} from "@/lib/github/db";

import {
  syncGitHubInstallationRepositories,
} from "@/lib/github/sync";

import {
  enqueueAnalyzeRepoJob,
} from "@/lib/queue";

import {
  limitAnalyze,
} from "@/lib/ratelimit";

import {
  createJob,
  createRepo,
  getLatestJobByRepoId,
  getRepoByGithubUrlAndBranch,
  getUserById,
  updateJob,
  updateRepo,
} from "@/lib/supabaseDb";

import {
  analyzeSchema,
} from "@/lib/validations/repo";

const ACTIVE_JOB_TIMEOUT_MS =
  20 * 60 * 1000;

function isActiveJobFresh(
  updatedAt:
    | string
    | undefined,

  createdAt:
    string,
): boolean {
  const timestamp =
    new Date(
      updatedAt ??
        createdAt,
    ).getTime();

  return (
    Number.isFinite(
      timestamp,
    ) &&
    Date.now() -
      timestamp <
      ACTIVE_JOB_TIMEOUT_MS
  );
}

function parseGitHubUrl(
  url: string,
): {
  owner: string;

  repo: string;

  branch: string;

  cloneUrl: string;
} {
  const regex =
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w./-]+))?$/;

  const match =
    url.match(regex);

  if (!match) {
    throw new Error(
      "INVALID_URL",
    );
  }

  const repo =
    match[2].replace(
      /\.git$/i,
      "",
    );

  return {
    owner:
      match[1],

    repo,

    branch:
      match[3] ??
      "HEAD",

    cloneUrl:
      `https://github.com/${match[1]}/${repo}`,
  };
}

export async function POST(
  req: Request,
) {
  try {
    const session =
      await getServerSession(
        authOptions,
      );

    if (
      !session?.user?.id
    ) {
      const error =
        getApiError(
          "UNAUTHORIZED",
        );

      return fail(
        error.code,
        error.message,
        error.status,
      );
    }

    const body =
      await req.json();

    const parsed =
      analyzeSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      const error =
        getApiError(
          "INVALID_INPUT",
          parsed.error
            .issues[0]
            ?.message ??
            "Invalid repository selection",
        );

      return fail(
        error.code,
        error.message,
        error.status,
      );
    }

    let owner:
      string;

    let repo:
      string;

    let branch:
      string;

    let cloneUrl:
      string;

    let githubInstallationId:
      number | null =
      null;

    let githubRepositoryId:
      string | null =
      null;

    let isPrivate =
      false;

    if (
      parsed.data
        .installationId &&
      parsed.data
        .githubRepositoryId
    ) {
      /*
       * Critical:
       * Validate this user's CURRENT GitHub access.
       *
       * A stale DB association is not enough authorization.
       */
      const userToken =
        await getValidGitHubUserAccessToken(
          session.user.id,
        );

      if (!userToken) {
        const error =
          getApiError(
            "UNAUTHORIZED",
            "GitHub authorization expired. Continue with GitHub again before analyzing a connected repository.",
          );

        return fail(
          error.code,
          error.message,
          401,
        );
      }

      const hasLiveAccess =
        await userCanAccessGitHubRepository(
          userToken,

          parsed.data
            .installationId,

          parsed.data
            .githubRepositoryId,
        );

      if (
        !hasLiveAccess
      ) {
        const error =
          getApiError(
            "UNAUTHORIZED",
            "GitHub no longer grants your account access to this repository",
          );

        return fail(
          error.code,
          error.message,
          403,
        );
      }

      let connectedRepo =
        await getGitHubRepositoryForUser(
          session.user.id,

          parsed.data
            .installationId,

          parsed.data
            .githubRepositoryId,
        );

      /*
       * Installation mirror may be stale.
       */
      if (!connectedRepo) {
        await syncGitHubInstallationRepositories(
          parsed.data
            .installationId,
        );

        connectedRepo =
          await getGitHubRepositoryForUser(
            session.user.id,

            parsed.data
              .installationId,

            parsed.data
              .githubRepositoryId,
          );
      }

      if (
        !connectedRepo ||
        connectedRepo.archived
      ) {
        const error =
          getApiError(
            "REPO_NOT_FOUND",

            connectedRepo
              ?.archived
              ? "Archived repositories cannot be analyzed in this version"
              : "This repository is not available through your RepoMind GitHub App installation",
          );

        return fail(
          error.code,
          error.message,
          error.status,
        );
      }

      owner =
        connectedRepo.owner;

      repo =
        connectedRepo.name;

      branch =
        connectedRepo.defaultBranch ||
        "HEAD";

      cloneUrl =
        connectedRepo.htmlUrl;

      githubInstallationId =
        connectedRepo.installationId;

      githubRepositoryId =
        connectedRepo.githubRepositoryId;

      isPrivate =
        connectedRepo.isPrivate;
    } else {
      const publicRepo =
        parseGitHubUrl(
          parsed.data.githubUrl!,
        );

      owner =
        publicRepo.owner;

      repo =
        publicRepo.repo;

      branch =
        publicRepo.branch;

      cloneUrl =
        publicRepo.cloneUrl;
    }

    const cached =
      await getRepoByGithubUrlAndBranch(
        cloneUrl,
        branch,
        session.user.id,
      );

    if (
      cached &&
      cached.status ===
        "COMPLETE" &&
      cached.expiresAt &&
      new Date(
        cached.expiresAt,
      ) > new Date()
    ) {
      return ok({
        cached:
          true,

        repoId:
          cached.id,
      });
    }

    /*
     * Reuse a live job rather than creating another job
     * for normal duplicate requests.
     */
    if (
      cached &&
      ![
        "COMPLETE",
        "FAILED",
        "CANCELLED",
      ].includes(
        cached.status,
      )
    ) {
      const existingJob =
        await getLatestJobByRepoId(
          cached.id,
        );

      if (
        existingJob &&
        isActiveJobFresh(
          existingJob.updatedAt,
          existingJob.createdAt,
        )
      ) {
        return ok(
          {
            alreadyRunning:
              true,

            repoId:
              cached.id,

            jobId:
              existingJob.id,
          },
          202,
        );
      }

      const staleMessage =
        "Previous analysis stopped before completion and was replaced.";

      await Promise.all([
        updateRepo(
          cached.id,
          {
            status:
              "FAILED",

            errorMessage:
              staleMessage,
          },
        ),

        existingJob
          ? updateJob(
              existingJob.id,
              {
                status:
                  "FAILED",

                progress:
                  0,

                currentStep:
                  "failed",

                errorLog:
                  staleMessage,

                completedAt:
                  new Date()
                    .toISOString(),
              },
            )
          : Promise.resolve(),
      ]);
    }

    const user =
      await getUserById(
        session.user.id,
      );

    if (!user) {
      const error =
        getApiError(
          "UNAUTHORIZED",
          "Your RepoMind account could not be loaded",
        );

      return fail(
        error.code,
        error.message,
        error.status,
      );
    }

    /*
     * Kept temporarily from old product.
     *
     * Phase 20 will replace credits with proper entitlements.
     */
    if (
      user.plan ===
        "FREE" &&
      user.creditsRemaining <=
        0
    ) {
      const error =
        getApiError(
          "CREDITS_EXHAUSTED",
        );

      return fail(
        error.code,
        error.message,
        error.status,
      );
    }

    const allowed =
      await limitAnalyze(
        `user:${user.id}`,

        user.plan !==
          "FREE",
      );

    if (!allowed) {
      const error =
        getApiError(
          "RATE_LIMITED",
        );

      return fail(
        error.code,
        error.message,
        error.status,
      );
    }

    const repoRow =
      await createRepo({
        userId:
          user.id,

        githubUrl:
          cloneUrl,

        githubInstallationId,

        githubRepositoryId,

        isPrivate,

        owner,

        name:
          repo,

        branch,

        status:
          "QUEUED",

        shareSlug:
          nanoid(10),
      });

    const jobRow =
      await createJob({
        repoId:
          repoRow.id,

        status:
          "QUEUED",

        progress:
          0,

        currentStep:
          "queued",
      });

    try {
      /*
       * No GitHub credentials in queue payload.
       *
       * Worker mints its own short-lived installation token.
       */
      await enqueueAnalyzeRepoJob({
        repoId:
          repoRow.id,

        jobId:
          jobRow.id,

        githubUrl:
          cloneUrl,

        githubInstallationId,

        githubRepositoryId,

        isPrivate,

        owner,

        repo,

        branch,
      });
    } catch (queueError) {
      const message =
        queueError instanceof
          Error
          ? queueError.message
          : "The analysis worker could not accept this job";

      await Promise.all([
        updateRepo(
          repoRow.id,
          {
            status:
              "FAILED",

            errorMessage:
              message,
          },
        ),

        updateJob(
          jobRow.id,
          {
            status:
              "FAILED",

            progress:
              0,

            currentStep:
              "failed",

            errorLog:
              message,

            completedAt:
              new Date()
                .toISOString(),
          },
        ),
      ]);

      throw queueError;
    }

    return ok(
      {
        jobId:
          jobRow.id,

        repoId:
          repoRow.id,
      },
      202,
    );
  } catch (error) {
    const message =
      error instanceof
        Error &&
      error.message ===
        "INVALID_URL"
        ? "Enter a valid GitHub repository URL"
        : undefined;

    const analysisError =
      getApiError(
        message
          ? "INVALID_URL"
          : "ANALYSIS_FAILED",

        message,
      );

    return fail(
      analysisError.code,
      analysisError.message,
      analysisError.status,
    );
  }
}
