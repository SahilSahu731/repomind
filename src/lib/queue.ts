import { Queue, type ConnectionOptions } from "bullmq";
import { after } from "next/server";
import { env } from "@/lib/env";
import { shouldUseLocalWorkspaceDatabase } from "@/lib/runtimeMode";
import {
  processAnalyzeRepoJob,
  type AnalyzeRepoJobData,
} from "@/lib/services/processAnalysisJob";

let queue: Queue | null = null;
let inlineQueue: Promise<void> = Promise.resolve();

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue("repo-analysis", {
      connection: getBullMqConnectionOptions(),
    });
  }

  return queue;
}

export function getBullMqConnectionOptions(
  options: { worker?: boolean } = {}
): ConnectionOptions {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
    ...(options.worker ? { maxRetriesPerRequest: null } : {}),
  };
}

export async function enqueueAnalyzeRepoJob(payload: AnalyzeRepoJobData): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase() || env.ANALYSIS_EXECUTION_MODE === "inline") {
    // Keep the serverless invocation alive after the 202 response. A detached
    // promise can be terminated as soon as Vercel finishes the request.
    after(async () => {
      const operation = inlineQueue.then(() => processAnalyzeRepoJob(payload));
      inlineQueue = operation.catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown analysis error";
        console.error(`[analysis:${payload.jobId}] ${message}`);
      });
      await inlineQueue;
    });
    return;
  }

  const activeQueue = getQueue();
  await activeQueue.add("analyze-repo", payload, { jobId: payload.jobId });
}
