import { Worker, type Job } from "bullmq";
import fs from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getRedisClient } from "@/lib/redis";
import { analyzeWithAI } from "@/lib/services/analyzer";
import { cleanupRepo, cloneRepo } from "@/lib/services/cloner";
import { detectEntryPoints } from "@/lib/services/entryDetector";
import { buildDependencyGraph } from "@/lib/services/graphBuilder";
import { walkDirectory } from "@/lib/services/parser";
import { detectTechStack } from "@/lib/services/techDetector";

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
    const repoRecord = await db.repo.findUnique({
      where: { id: repoId },
      select: { userId: true },
    });

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

      await db.analysisResult.create({
        data: {
          repoId,
          summary: aiResult.summary,
          architecture: aiResult.architecture as unknown as Prisma.InputJsonValue,
          fileTree: tree as unknown as Prisma.InputJsonValue,
          dependencyGraph: depGraph as unknown as Prisma.InputJsonValue,
          entryPoints: entryPoints as unknown as Prisma.InputJsonValue,
          startGuide: aiResult.startGuide,
          fileSummaries: aiResult.fileSummaries,
          techStack: techStack as unknown as Prisma.InputJsonValue,
        },
      });

      await consumeCreditIfNeeded(repoRecord.userId);

      await db.repo.update({
        where: { id: repoId },
        data: {
          status: "COMPLETE",
          totalFiles: stats.totalFiles,
          totalLines: stats.totalLines,
          defaultLanguage: stats.primaryLanguage,
          analyzedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
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
  await db.job.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      currentStep: step,
      ...(status === "PROCESSING" && !error ? { startedAt: new Date() } : {}),
      ...(status === "COMPLETED" || status === "FAILED"
        ? { completedAt: new Date() }
        : {}),
      ...(error ? { errorLog: error } : {}),
    },
  });
}

async function updateRepo(
  repoId: string,
  status: "QUEUED" | "CLONING" | "PARSING" | "ANALYZING" | "COMPLETE" | "FAILED",
  error?: string
): Promise<void> {
  await db.repo.update({
    where: { id: repoId },
    data: {
      status,
      ...(error ? { errorMessage: error } : {}),
    },
  });
}

async function consumeCreditIfNeeded(userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });

    if (!user) {
      throw new Error("UNAUTHORIZED: User not found for credit consumption");
    }

    if (user.plan !== "FREE") {
      return;
    }

    const result = await tx.user.updateMany({
      where: {
        id: userId,
        creditsRemaining: { gt: 0 },
      },
      data: {
        creditsRemaining: { decrement: 1 },
      },
    });

    if (result.count === 0) {
      throw new Error("CREDITS_EXHAUSTED: No credits remaining for analysis");
    }
  });
}
