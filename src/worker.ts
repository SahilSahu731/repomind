import * as Sentry
  from "@sentry/nextjs";

import {
  UnrecoverableError,
  Worker,
  type Job,
} from "bullmq";

import IORedis, {
  type RedisOptions,
} from "ioredis";

import {
  env,
} from "@/lib/env";

import {
  ANALYSIS_QUEUE_NAME,
  ANALYSIS_WORKER_HEARTBEAT_KEY,
  getBullMqConnectionOptions,
} from "@/lib/queueConnection";

import {
  isRecoverableAnalysisError,
  processAnalyzeRepoJob,
  type AnalyzeRepoJobData,
} from "@/lib/services/processAnalysisJob";

if (
  env.ANALYSIS_EXECUTION_MODE !==
  "bullmq"
) {
  throw new Error(
    "The worker requires ANALYSIS_EXECUTION_MODE=bullmq",
  );
}

if (
  env.SENTRY_DSN
) {
  Sentry.init({
    dsn:
      env.SENTRY_DSN,

    environment:
      env.NODE_ENV,

    enabled:
      env.NODE_ENV ===
      "production",

    sendDefaultPii:
      false,

    tracesSampleRate:
      0.1,
  });
}

/*
 * Separate Redis connection for worker heartbeat.
 */
const heartbeatRedis =
  new IORedis({
    ...(getBullMqConnectionOptions({
      worker: true,
    }) as RedisOptions),

    lazyConnect:
      true,
  });

async function writeHeartbeat() {
  if (
    heartbeatRedis.status ===
    "wait"
  ) {
    await heartbeatRedis.connect();
  }

  /*
   * TTL ensures a crashed worker automatically becomes unhealthy.
   */
  await heartbeatRedis.set(
    ANALYSIS_WORKER_HEARTBEAT_KEY,
    new Date()
      .toISOString(),
    "EX",
    45,
  );
}

void writeHeartbeat().catch(
  (error) => {
    console.error(
      "[worker] initial heartbeat failed",
      error,
    );
  },
);

const heartbeatInterval =
  setInterval(
    () => {
      void writeHeartbeat().catch(
        (error) => {
          console.error(
            "[worker] heartbeat failed",
            error,
          );
        },
      );
    },
    15_000,
  );

heartbeatInterval.unref();

const worker =
  new Worker<AnalyzeRepoJobData>(
    ANALYSIS_QUEUE_NAME,

    async (
      job:
        Job<AnalyzeRepoJobData>,
    ) => {
      try {
        await processAnalyzeRepoJob(
          job.data,
          {
            attemptsMade:
              job.attemptsMade,

            maxAttempts:
              Number(
                job.opts
                  .attempts ??
                  env.ANALYSIS_JOB_ATTEMPTS,
              ),
          },
        );
      } catch (error) {
        if (
          !isRecoverableAnalysisError(
            error,
          )
        ) {
          throw new UnrecoverableError(
            error instanceof
              Error
              ? error.message
              : "Unrecoverable repository analysis failure",
          );
        }

        throw error;
      }
    },

    {
      connection:
        getBullMqConnectionOptions({
          worker: true,
        }),

      concurrency:
        env.ANALYSIS_WORKER_CONCURRENCY,

      /*
       * Protect GitHub/model providers and your own CPU.
       */
      limiter: {
        max:
          10,

        duration:
          60_000,
      },
    },
  );

worker.on(
  "completed",
  (job) => {
    console.info(
      `[worker] completed analysis job ${job.id}`,
    );
  },
);

worker.on(
  "failed",
  (
    job,
    error,
  ) => {
    Sentry.captureException(
      error,
      {
        tags: {
          process:
            "analysis-worker",
        },

        extra: {
          jobId:
            job?.id,

          repoId:
            job?.data.repoId,

          attemptsMade:
            job?.attemptsMade,
        },
      },
    );
  },
);

worker.on(
  "error",
  (error) => {
    Sentry.captureException(
      error,
      {
        tags: {
          process:
            "analysis-worker",
        },
      },
    );
  },
);

async function shutdown(
  signal: string,
) {
  console.info(
    `[worker] received ${signal}; closing gracefully`,
  );

  const forceExit =
    setTimeout(
      () =>
        process.exit(1),
      30_000,
    );

  forceExit.unref();

  clearInterval(
    heartbeatInterval,
  );

  await worker.close();

  heartbeatRedis.disconnect();

  clearTimeout(
    forceExit,
  );

  process.exit(0);
}

process.once(
  "SIGTERM",
  () =>
    void shutdown(
      "SIGTERM",
    ),
);

process.once(
  "SIGINT",
  () =>
    void shutdown(
      "SIGINT",
    ),
);
