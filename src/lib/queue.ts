import { Queue } from "bullmq";
import { env } from "@/lib/env";

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue("repo-analysis", {
      // NOTE: BullMQ needs Redis TCP connection details.
      // This placeholder keeps compile-time stability; runtime env must provide compatible values.
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    });
  }

  return queue;
}

export async function enqueueAnalyzeRepoJob(payload: {
  repoId: string;
  jobId: string;
  githubUrl: string;
  owner: string;
  repo: string;
  branch: string;
}): Promise<void> {
  const activeQueue = getQueue();
  await activeQueue.add("analyze-repo", payload);
}
