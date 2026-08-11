import { Worker, type Job } from "bullmq";
import { getBullMqConnectionOptions } from "@/lib/queue";
import {
  processAnalyzeRepoJob,
  type AnalyzeRepoJobData,
} from "@/lib/services/processAnalysisJob";

const worker = new Worker(
  "repo-analysis",
  async (job: Job<AnalyzeRepoJobData>) => processAnalyzeRepoJob(job.data),
  {
    connection: getBullMqConnectionOptions({ worker: true }),
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  }
);

void worker;
