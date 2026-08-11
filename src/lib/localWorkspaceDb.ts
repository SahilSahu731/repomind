import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type {
  AnalysisResultInput,
  AnalysisResultRow,
  JobRow,
  JobStatus,
  Plan,
  RepoRow,
  RepoStatus,
  UserSeedInput,
} from "@/lib/supabaseDb";

interface LocalUserRow {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  githubUsername: string | null;
  plan: Plan;
  creditsRemaining: number;
  createdAt: string;
  updatedAt: string;
}

interface LocalWorkspaceData {
  version: 1;
  users: LocalUserRow[];
  repos: RepoRow[];
  jobs: JobRow[];
  analysisResults: AnalysisResultRow[];
}

interface RepoListResult {
  repos: RepoRow[];
  total: number;
}

const workspaceDirectory = path.join(process.cwd(), ".repomind");
const workspaceFile = path.join(workspaceDirectory, "workspace.json");
const workspaceLockFile = path.join(workspaceDirectory, "workspace.lock");
const lockRetryMs = 25;
const lockTimeoutMs = 10_000;
const staleLockMs = 30_000;
let mutationQueue: Promise<void> = Promise.resolve();

function emptyWorkspace(): LocalWorkspaceData {
  return {
    version: 1,
    users: [],
    repos: [],
    jobs: [],
    analysisResults: [],
  };
}

function isWorkspaceData(value: unknown): value is LocalWorkspaceData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LocalWorkspaceData>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.repos) &&
    Array.isArray(candidate.jobs) &&
    Array.isArray(candidate.analysisResults)
  );
}

async function readWorkspace(): Promise<LocalWorkspaceData> {
  try {
    const contents = await readFile(workspaceFile, "utf8");
    const parsed = JSON.parse(contents) as unknown;
    if (!isWorkspaceData(parsed)) {
      throw new Error("Local workspace database has an invalid format");
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return emptyWorkspace();
    }
    throw error;
  }
}

async function writeWorkspace(workspace: LocalWorkspaceData): Promise<void> {
  await mkdir(workspaceDirectory, { recursive: true });
  const temporaryFile = path.join(
    workspaceDirectory,
    `workspace-${process.pid}-${randomUUID()}.tmp`
  );

  try {
    await writeFile(temporaryFile, JSON.stringify(workspace, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryFile, workspaceFile);
  } catch (error) {
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

async function wait(delayMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function removeStaleLock(): Promise<void> {
  try {
    const lockStat = await stat(workspaceLockFile);
    if (Date.now() - lockStat.mtimeMs > staleLockMs) {
      await unlink(workspaceLockFile).catch(() => undefined);
    }
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }
}

async function withFileLock<T>(operation: () => Promise<T>): Promise<T> {
  await mkdir(workspaceDirectory, { recursive: true });
  const startedAt = Date.now();

  while (true) {
    try {
      const handle = await open(workspaceLockFile, "wx", 0o600);
      await handle.close();
      break;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) {
        throw error;
      }

      await removeStaleLock();
      if (Date.now() - startedAt >= lockTimeoutMs) {
        throw new Error("Timed out waiting for the local workspace database lock");
      }
      await wait(lockRetryMs);
    }
  }

  try {
    return await operation();
  } finally {
    await unlink(workspaceLockFile).catch(() => undefined);
  }
}

async function readConsistentWorkspace(): Promise<LocalWorkspaceData> {
  await mutationQueue;
  return readWorkspace();
}

async function mutateWorkspace<T>(
  mutate: (workspace: LocalWorkspaceData) => T | Promise<T>
): Promise<T> {
  const operation = mutationQueue.then(() =>
    withFileLock(async () => {
      const workspace = await readWorkspace();
      const result = await mutate(workspace);
      await writeWorkspace(workspace);
      return result;
    })
  );

  mutationQueue = operation.then(
    () => undefined,
    () => undefined
  );
  return operation;
}

export async function localListReposByUser(
  userId: string,
  page: number,
  limit: number,
  status?: string
): Promise<RepoListResult> {
  const workspace = await readConsistentWorkspace();
  const matching = workspace.repos
    .filter((repo) => repo.userId === userId && (!status || status === "all" || repo.status === status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const offset = (page - 1) * limit;

  return {
    repos: matching.slice(offset, offset + limit),
    total: matching.length,
  };
}

export async function localGetRepoByGithubUrlAndBranch(
  githubUrl: string,
  branch: string,
  userId?: string
): Promise<RepoRow | null> {
  const workspace = await readConsistentWorkspace();
  return (
    workspace.repos
      .filter(
        (repo) =>
          repo.githubUrl === githubUrl &&
          repo.branch === branch &&
          (!userId || repo.userId === userId)
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null
  );
}

export async function localCreateRepo(input: {
  userId: string;
  githubUrl: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoStatus;
  shareSlug: string;
}): Promise<RepoRow> {
  return mutateWorkspace((workspace) => {
    const now = new Date().toISOString();
    const repo: RepoRow = {
      ...input,
      id: randomUUID(),
      expiresAt: null,
      createdAt: now,
    };
    workspace.repos.push(repo);
    return repo;
  });
}

export async function localCreateJob(input: {
  repoId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
}): Promise<JobRow> {
  return mutateWorkspace((workspace) => {
    if (!workspace.repos.some((repo) => repo.id === input.repoId)) {
      throw new Error(`REPO_NOT_FOUND: Missing repo ${input.repoId}`);
    }

    const job: JobRow = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    workspace.jobs.push(job);
    return job;
  });
}

export async function localGetRepoById(repoId: string): Promise<{ userId: string } | null> {
  const workspace = await readConsistentWorkspace();
  const repo = workspace.repos.find((candidate) => candidate.id === repoId);
  return repo ? { userId: repo.userId } : null;
}

export async function localGetRepoByIdForUser(
  repoId: string,
  userId: string
): Promise<RepoRow | null> {
  const workspace = await readConsistentWorkspace();
  return workspace.repos.find((repo) => repo.id === repoId && repo.userId === userId) ?? null;
}

export async function localGetLatestJobByRepoId(repoId: string): Promise<JobRow | null> {
  const workspace = await readConsistentWorkspace();
  return (
    workspace.jobs
      .filter((job) => job.repoId === repoId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null
  );
}

export async function localGetJobById(jobId: string): Promise<JobRow | null> {
  const workspace = await readConsistentWorkspace();
  return workspace.jobs.find((job) => job.id === jobId) ?? null;
}

export async function localGetAnalysisResultByRepoId(
  repoId: string
): Promise<AnalysisResultRow | null> {
  const workspace = await readConsistentWorkspace();
  return workspace.analysisResults.find((result) => result.repoId === repoId) ?? null;
}

export async function localCreateAnalysisResult(input: AnalysisResultInput): Promise<void> {
  await mutateWorkspace((workspace) => {
    const now = new Date().toISOString();
    const result: AnalysisResultRow = {
      ...input,
      id: randomUUID(),
      createdAt: now,
    };
    const existingIndex = workspace.analysisResults.findIndex(
      (candidate) => candidate.repoId === input.repoId
    );

    if (existingIndex >= 0) {
      workspace.analysisResults[existingIndex] = result;
    } else {
      workspace.analysisResults.push(result);
    }
  });
}

export async function localUpdateRepo(
  repoId: string,
  updates: Partial<RepoRow>
): Promise<void> {
  await mutateWorkspace((workspace) => {
    const index = workspace.repos.findIndex((repo) => repo.id === repoId);
    if (index < 0) {
      throw new Error(`REPO_NOT_FOUND: Missing repo ${repoId}`);
    }
    workspace.repos[index] = { ...workspace.repos[index], ...updates, id: repoId };
  });
}

export async function localUpdateJob(
  jobId: string,
  updates: Partial<JobRow>
): Promise<void> {
  await mutateWorkspace((workspace) => {
    const index = workspace.jobs.findIndex((job) => job.id === jobId);
    if (index < 0) {
      throw new Error(`JOB_NOT_FOUND: Missing job ${jobId}`);
    }
    workspace.jobs[index] = { ...workspace.jobs[index], ...updates, id: jobId };
  });
}

export async function localGetUserById(
  userId: string
): Promise<Pick<LocalUserRow, "id" | "plan" | "creditsRemaining"> | null> {
  const workspace = await readConsistentWorkspace();
  const user = workspace.users.find((candidate) => candidate.id === userId);
  return user
    ? { id: user.id, plan: user.plan, creditsRemaining: user.creditsRemaining }
    : null;
}

export async function localConsumeCreditIfNeeded(userId: string): Promise<void> {
  await mutateWorkspace((workspace) => {
    const index = workspace.users.findIndex((user) => user.id === userId);
    if (index < 0 || workspace.users[index].plan !== "FREE") {
      return;
    }
    if (workspace.users[index].creditsRemaining <= 0) {
      throw new Error("CREDITS_EXHAUSTED: No credits remaining for analysis");
    }

    workspace.users[index] = {
      ...workspace.users[index],
      creditsRemaining: workspace.users[index].creditsRemaining - 1,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function localEnsureUserExists(input: UserSeedInput): Promise<void> {
  await mutateWorkspace((workspace) => {
    const now = new Date().toISOString();
    const index = workspace.users.findIndex((user) => user.id === input.id);

    if (index >= 0) {
      const existing = workspace.users[index];
      workspace.users[index] = {
        ...existing,
        email: input.email ?? existing.email,
        name: input.name ?? existing.name,
        image: input.image ?? existing.image,
        githubUsername: input.githubUsername ?? existing.githubUsername,
        updatedAt: now,
      };
      return;
    }

    workspace.users.push({
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      image: input.image ?? null,
      githubUsername: input.githubUsername ?? null,
      plan: input.plan,
      creditsRemaining: Math.max(0, Math.floor(input.creditsRemaining)),
      createdAt: now,
      updatedAt: now,
    });
  });
}

export async function localCheckWorkspaceHealth(): Promise<void> {
  await readConsistentWorkspace();
}
