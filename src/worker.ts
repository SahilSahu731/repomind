import { Worker, type Job } from "bullmq";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import { getRedisClient } from "@/lib/redis";
import {
  consumeCreditIfNeeded,
  createAnalysisResult,
  getRepoById,
  updateJob as updateJobRecord,
  updateRepo as updateRepoRecord,
} from "@/lib/supabaseDb";
import { analyzeWithAI } from "@/lib/services/analyzer";
import { cleanupRepo, cloneRepo } from "@/lib/services/cloner";
import { detectEntryPoints } from "@/lib/services/entryDetector";
import { buildDependencyGraph } from "@/lib/services/graphBuilder";
import { walkDirectory } from "@/lib/services/parser";
import { detectTechStack } from "@/lib/services/techDetector";
import { calculateContributionScore } from "@/lib/services/contributionScore";

interface AnalyzeJobData {
  repoId: string;
  jobId: string;
  githubUrl: string;
  owner: string;
  repo: string;
  branch: string;
}

const worker = new Worker(
  "repo-analysis",
  async (job: Job<AnalyzeJobData>) => {
    const { repoId, jobId, githubUrl, owner, repo, branch } = job.data;
    const targetDir = path.join("/tmp/repos", jobId);
    const repoRecord = await getRepoById(repoId);

    if (!repoRecord) {
      throw new Error(`REPO_NOT_FOUND: Missing repo for job ${jobId}`);
    }

    try {
      await updateJob(jobId, "PROCESSING", 10, "cloning");
      await updateRepo(repoId, "CLONING");
      await cloneRepo(githubUrl, branch, targetDir);

      await updateJob(jobId, "PROCESSING", 30, "parsing");
      await updateRepo(repoId, "PARSING");
      const { tree, flatFiles, stats } = await walkDirectory(targetDir, targetDir);

      await updateJob(jobId, "PROCESSING", 50, "detecting_stack");
      const techStack = await detectTechStack(targetDir, flatFiles);

      await updateJob(jobId, "PROCESSING", 65, "building_graph");
      await updateRepo(repoId, "ANALYZING");
      const depGraph = await buildDependencyGraph(flatFiles, targetDir);

      await updateJob(jobId, "PROCESSING", 75, "detecting_entries");
      const entryPoints = await detectEntryPoints(flatFiles, depGraph);

      const readme = readFileIfExists(path.join(targetDir, "README.md"));
      const packageJson = readFileIfExists(path.join(targetDir, "package.json"));

      await updateJob(jobId, "PROCESSING", 90, "ai_analysis");
      const aiResult = await analyzeWithAI({
        fileTree: tree,
        flatFiles,
        depGraph,
        techStack,
        entryPoints,
        readme,
        packageJson,
        owner,
        repo,
      });

      // Calculate Contribution Readiness Score
      const filePaths = flatFiles.map((f: { path: string }) => f.path);
      const contributionScore = calculateContributionScore({
        fileTree: filePaths,
        readmeContent: readme,
        languages: techStack.languages,
        frameworks: techStack.frameworks,
      });

      await createAnalysisResult({
        repoId,
        summary: aiResult.summary,
        architecture: aiResult.architecture,
        fileTree: tree,
        dependencyGraph: depGraph,
        entryPoints,
        startGuide: aiResult.startGuide,
        fileSummaries: aiResult.fileSummaries,
        techStack,
        contributionScore,
      });

      await consumeCreditIfNeeded(repoRecord.userId);

      await updateRepoRecord(repoId, {
        status: "COMPLETE",
        totalFiles: stats.totalFiles,
        totalLines: stats.totalLines,
        defaultLanguage: stats.primaryLanguage,
        analyzedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      await updateJob(jobId, "COMPLETED", 100, "complete");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      await updateJob(jobId, "FAILED", 0, "failed", message);
      await updateRepo(repoId, "FAILED", message);
    } finally {
      await cleanupRepo(targetDir);
    }
  },
  {
    connection:
      (getRedisClient() as unknown as Record<string, never>) ?? {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  }
);

void worker;

function readFileIfExists(filePath: string): string | undefined {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function updateJob(
  jobId: string,
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "TIMEOUT",
  progress: number,
  step: string,
  error?: string
): Promise<void> {
  await updateJobInStore(jobId, {
    status,
    progress,
    currentStep: step,
    ...(status === "PROCESSING" && !error ? { startedAt: new Date().toISOString() } : {}),
    ...(status === "COMPLETED" || status === "FAILED"
      ? { completedAt: new Date().toISOString() }
      : {}),
    ...(error ? { errorLog: error } : {}),
  });
}

async function updateJobInStore(jobId: string, updates: Record<string, unknown>): Promise<void> {
  await updateJobRecord(jobId, updates);
}

async function updateRepo(
  repoId: string,
  status: "QUEUED" | "CLONING" | "PARSING" | "ANALYZING" | "COMPLETE" | "FAILED",
  error?: string
): Promise<void> {
  await updateRepoInStore(repoId, {
    status,
    ...(error ? { errorMessage: error } : {}),
  });
}

async function updateRepoInStore(repoId: string, updates: Record<string, unknown>): Promise<void> {
  await updateRepoRecord(repoId, updates);
}
