import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  consumeCreditIfNeeded,
  createAnalysisResult,
  getRepoById,
  updateJob as updateJobRecord,
  updateRepo as updateRepoRecord,
} from "@/lib/supabaseDb";
import { analyzeWithAI } from "@/lib/services/analyzer";
import { cleanupRepo, cloneRepo } from "@/lib/services/cloner";
import { calculateContributionScore } from "@/lib/services/contributionScore";
import { detectEntryPoints } from "@/lib/services/entryDetector";
import { buildDependencyGraph } from "@/lib/services/graphBuilder";
import { walkDirectory } from "@/lib/services/parser";
import { detectTechStack } from "@/lib/services/techDetector";

export interface AnalyzeRepoJobData {
  repoId: string;
  jobId: string;
  githubUrl: string;
  owner: string;
  repo: string;
  branch: string;
}

type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "TIMEOUT";
type RepoStatus = "QUEUED" | "CLONING" | "PARSING" | "ANALYZING" | "COMPLETE" | "FAILED";

export async function processAnalyzeRepoJob(data: AnalyzeRepoJobData): Promise<void> {
  const { repoId, jobId, githubUrl, owner, repo, branch } = data;
  const targetDir = getJobTargetDirectory(jobId);

  try {
    const repoRecord = await getRepoById(repoId);
    if (!repoRecord) {
      throw new Error(`REPO_NOT_FOUND: Missing repo for job ${jobId}`);
    }

    await updateJob(jobId, "PROCESSING", 10, "cloning", { markStarted: true });
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

    const contributionScore = calculateContributionScore({
      fileTree: flatFiles.map((file) => file.path),
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
      errorMessage: null,
    });
    await updateJob(jobId, "COMPLETED", 100, "complete");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown analysis error";

    await Promise.allSettled([
      updateJob(jobId, "FAILED", 0, "failed", { error: message }),
      updateRepo(repoId, "FAILED", message),
    ]);

    throw error;
  } finally {
    await cleanupRepo(targetDir);
  }
}

function getJobTargetDirectory(jobId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(jobId)) {
    throw new Error("INVALID_JOB_ID: Job identifier contains unsupported characters");
  }

  return path.join(os.tmpdir(), "repomind-repos", jobId);
}

function readFileIfExists(filePath: string): string | undefined {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      return undefined;
    }

    return fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function updateJob(
  jobId: string,
  status: JobStatus,
  progress: number,
  step: string,
  options: { error?: string; markStarted?: boolean } = {}
): Promise<void> {
  const isFinished = status === "COMPLETED" || status === "FAILED" || status === "TIMEOUT";

  await updateJobRecord(jobId, {
    status,
    progress,
    currentStep: step,
    ...(options.markStarted ? { startedAt: new Date().toISOString() } : {}),
    ...(isFinished ? { completedAt: new Date().toISOString() } : {}),
    ...(options.error ? { errorLog: options.error } : {}),
  });
}

async function updateRepo(repoId: string, status: RepoStatus, error?: string): Promise<void> {
  await updateRepoRecord(repoId, {
    status,
    ...(error ? { errorMessage: error } : {}),
  });
}
