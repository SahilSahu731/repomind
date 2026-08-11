import * as Sentry from "@sentry/nextjs";
import { Worker, type Job } from "bullmq";
import { env } from "@/lib/env";
import { getBullMqConnectionOptions } from "@/lib/queue";
import {
  processAnalyzeRepoJob,
  type AnalyzeRepoJobData,
} from "@/lib/services/processAnalysisJob";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    enabled: env.NODE_ENV === "production",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

const worker = new Worker(
  "repo-analysis",
  async (job: Job<AnalyzeRepoJobData>) => processAnalyzeRepoJob(job.data),
  {
    connection: getBullMqConnectionOptions({ worker: true }),
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  }
);

worker.on("failed", (job, error) => {
  Sentry.captureException(error, {
    tags: { process: "analysis-worker" },
    extra: { jobId: job?.id, repoId: job?.data.repoId },
  });
});

worker.on("error", (error) => {
  Sentry.captureException(error, { tags: { process: "analysis-worker" } });
});
