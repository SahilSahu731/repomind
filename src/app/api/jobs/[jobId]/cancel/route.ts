import {
  getServerSession,
} from "next-auth";

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
  removeQueuedAnalyzeJob,
} from "@/lib/queue";

import {
  getJobById,
  getRepoByIdForUser,
  updateJob,
  updateRepo,
} from "@/lib/supabaseDb";

export async function POST(
  _req: Request,

  {
    params,
  }: {
    params:
      | Promise<{
          jobId: string;
        }>
      | {
          jobId: string;
        };
  },
) {
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

  const {
    jobId,
  } =
    await Promise.resolve(
      params,
    );

  const job =
    await getJobById(
      jobId,
    );

  if (!job) {
    const error =
      getApiError(
        "REPO_NOT_FOUND",
        "Analysis job was not found",
      );

    return fail(
      error.code,
      error.message,
      404,
    );
  }

  /*
   * Ownership check prevents users cancelling other users' jobs.
   */
  const repo =
    await getRepoByIdForUser(
      job.repoId,
      session.user.id,
    );

  if (!repo) {
    const error =
      getApiError(
        "REPO_NOT_FOUND",
        "Analysis job was not found",
      );

    return fail(
      error.code,
      error.message,
      404,
    );
  }

  if (
    [
      "COMPLETED",
      "FAILED",
      "TIMEOUT",
      "CANCELLED",
    ].includes(
      job.status,
    )
  ) {
    return ok({
      jobId,

      repoId:
        repo.id,

      status:
        job.status,

      alreadyFinished:
        true,
    });
  }

  const completedAt =
    new Date()
      .toISOString();

  await Promise.all([
    updateJob(
      jobId,
      {
        status:
          "CANCELLED",

        currentStep:
          "cancelled",

        errorLog:
          null,

        completedAt,
      },
    ),

    updateRepo(
      repo.id,
      {
        status:
          "CANCELLED",

        errorMessage:
          "Analysis cancelled by the user",
      },
    ),
  ]);

  const removedFromQueue =
    await removeQueuedAnalyzeJob(
      jobId,
    ).catch(
      () => false,
    );

  return ok({
    jobId,

    repoId:
      repo.id,

    status:
      "CANCELLED",

    removedFromQueue,
  });
}
