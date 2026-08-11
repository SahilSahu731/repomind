import { Queue, type ConnectionOptions } from "bullmq";
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
    inlineQueue = inlineQueue
      .then(() => processAnalyzeRepoJob(payload))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown analysis error";
        console.error(`[analysis:${payload.jobId}] ${message}`);
      });
    return;
  }

  const activeQueue = getQueue();
  await activeQueue.add("analyze-repo", payload, { jobId: payload.jobId });
}
