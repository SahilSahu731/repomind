import {
  Queue,
} from "bullmq";

import {
  after,
} from "next/server";

import {
  env,
} from "@/lib/env";

import {
  ANALYSIS_QUEUE_NAME,
  getBullMqConnectionOptions,
} from "@/lib/queueConnection";

import {
  processAnalyzeRepoJob,
  type AnalyzeRepoJobData,
} from "@/lib/services/processAnalysisJob";

let queue:
  Queue<AnalyzeRepoJobData> | null =
  null;

let inlineQueue:
  Promise<void> =
  Promise.resolve();

function getQueue():
  Queue<AnalyzeRepoJobData> {
  if (!queue) {
    queue =
      new Queue<AnalyzeRepoJobData>(
        ANALYSIS_QUEUE_NAME,
        {
          connection:
            getBullMqConnectionOptions(),

          defaultJobOptions: {
            attempts:
              env.ANALYSIS_JOB_ATTEMPTS,

            backoff: {
              type:
                "exponential",

              delay:
                5_000,
            },

            removeOnComplete: {
              age:
                24 *
                60 *
                60,

              count:
                500,
            },

            removeOnFail: {
              age:
                7 *
                24 *
                60 *
                60,

              count:
                2_000,
            },
          },
        },
      );
  }

  return queue;
}

export async function enqueueAnalyzeRepoJob(
  payload:
    AnalyzeRepoJobData,
): Promise<void> {
  /*
   * Inline is development convenience only.
   */
  if (
    env.ANALYSIS_EXECUTION_MODE ===
    "inline"
  ) {
    if (
      env.NODE_ENV ===
      "production"
    ) {
      throw new Error(
        "INLINE_ANALYSIS_DISABLED_IN_PRODUCTION",
      );
    }

    after(
      async () => {
        const operation =
          inlineQueue.then(
            () =>
              processAnalyzeRepoJob(
                payload,
                {
                  attemptsMade:
                    0,

                  maxAttempts:
                    1,
                },
              ),
          );

        inlineQueue =
          operation.catch(
            (
              error:
                unknown,
            ) => {
              const message =
                error instanceof
                  Error
                  ? error.message
                  : "Unknown analysis error";

              console.error(
                `[analysis:${payload.jobId}] ${message}`,
              );
            },
          );

        await inlineQueue;
      },
    );

    return;
  }

  await getQueue().add(
    "analyze-repo",
    payload,
    {
      // BullMQ-level idempotency for the same DB job.
      jobId:
        payload.jobId,
    },
  );
}

export async function removeQueuedAnalyzeJob(
  jobId: string,
): Promise<boolean> {
  if (
    env.ANALYSIS_EXECUTION_MODE ===
    "inline"
  ) {
    return false;
  }

  const job =
    await getQueue().getJob(
      jobId,
    );

  if (!job) {
    return false;
  }

  const state =
    await job.getState();

  if (
    [
      "waiting",
      "delayed",
      "prioritized",
      "paused",
    ].includes(state)
  ) {
    await job.remove();

    return true;
  }

  /*
   * Active BullMQ jobs are cancelled cooperatively.
   * DB status becomes CANCELLED and the worker checks
   * cancellation between expensive stages.
   */
  return false;
}

export async function closeAnalysisQueue():
  Promise<void> {
  if (queue) {
    await queue.close();

    queue =
      null;
  }
}
