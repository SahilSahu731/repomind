import { env } from "@/lib/env";
import {
  localCheckWorkspaceHealth,
  localConsumeCreditIfNeeded,
  localCreateAnalysisResult,
  localCreateJob,
  localCreateRepo,
  localEnsureUserExists,
  localGetAnalysisResultByRepoId,
  localGetJobById,
  localGetLatestJobByRepoId,
  localGetLatestJobsByRepoIds,
  localGetRepoByGithubUrlAndBranch,
  localGetRepoById,
  localGetRepoByIdForUser,
  localGetUserById,
  localListReposByUser,
  localUpdateJob,
  localUpdateRepo,
} from "@/lib/localWorkspaceDb";
import { shouldUseLocalWorkspaceDatabase } from "@/lib/runtimeMode";

type RequestMethod = "GET" | "POST" | "PATCH";
type LogicalTable = "User" | "Repo" | "Job" | "AnalysisResult";

export type Plan = "FREE" | "PRO" | "ENTERPRISE";
export type RepoStatus = "QUEUED" | "CLONING" | "PARSING" | "ANALYZING" | "COMPLETE" | "FAILED";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "TIMEOUT";

interface SupabaseQueryOptions {
  count?: "exact";
  select?: string;
  preferReturnRepresentation?: boolean;
}

export interface UserRow {
  id: string;
  plan: Plan;
  creditsRemaining: number;
}

export interface UserSeedInput {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  githubUsername?: string | null;
  plan: Plan;
  creditsRemaining: number;
}

export interface RepoRow {
  id: string;
  userId: string;
  githubUrl: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoStatus;
  expiresAt: string | null;
  createdAt: string;
  totalFiles?: number;
  totalLines?: number;
  defaultLanguage?: string | null;
  analyzedAt?: string | null;
  errorMessage?: string | null;
}

export interface JobRow {
  id: string;
  repoId: string;
  status: JobStatus;
  progress: number;
  currentStep: string | null;
  createdAt: string;
  updatedAt?: string;
  errorLog?: string | null;
  completedAt?: string | null;
}

export interface AnalysisResultRow {
  id: string;
  repoId: string;
  summary: string;
  architecture: unknown;
  fileTree: unknown;
  dependencyGraph: unknown;
  entryPoints: unknown;
  startGuide: string;
  fileSummaries: unknown;
  techStack: unknown;
  contributionScore?: unknown;
  createdAt?: string;
}

export interface AnalysisResultInput {
  repoId: string;
  summary: string;
  architecture: unknown;
  fileTree: unknown;
  dependencyGraph: unknown;
  entryPoints: unknown;
  startGuide: string;
  fileSummaries: unknown;
  techStack: unknown;
  contributionScore?: unknown;
}

interface RepoListResult {
  repos: RepoRow[];
  total: number;
}

const TABLE_CANDIDATES: Record<LogicalTable, string[]> = {
  User: ["User", "users", "user_profiles", "Profiles"],
  Repo: ["Repo", "repos", "repository", "repositories"],
  Job: ["Job", "jobs"],
  AnalysisResult: ["AnalysisResult", "analysis_results", "analysisresult"],
};

function getDatabaseConfig() {
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    throw new Error("Supabase database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { baseUrl, serviceKey };
}

async function supabaseRequest<T>(
  tablePath: string,
  method: RequestMethod,
  body?: Record<string, unknown>,
  options?: SupabaseQueryOptions
): Promise<{ data: T; count: number | null }> {
  const { baseUrl, serviceKey } = getDatabaseConfig();

  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  if (options?.count) {
    headers.Prefer = `count=${options.count}`;
  }

  if (options?.preferReturnRepresentation) {
    headers.Prefer = headers.Prefer
      ? `${headers.Prefer},return=representation`
      : "return=representation";
  }

  const response = await fetch(`${baseUrl}/rest/v1/${tablePath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Supabase request failed (${response.status}): ${errorBody}`);
  }

  const countHeader = response.headers.get("content-range");
  const count = countHeader && countHeader.includes("/")
    ? Number(countHeader.split("/")[1])
    : null;

  const data = (await response.json().catch(() => [])) as T;
  return { data, count };
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function isMissingTableError(error: unknown, tableName: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("PGRST205") && error.message.includes(`public.${tableName}`);
}

function isMissingTableErrorForAnyCandidate(error: unknown, tableNames: string[]): boolean {
  return tableNames.some((tableName) => isMissingTableError(error, tableName));
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("23505");
}

async function supabaseRequestWithTableFallback<T>(
  logicalTable: LogicalTable,
  suffix: string,
  method: RequestMethod,
  body?: Record<string, unknown>,
  options?: SupabaseQueryOptions
): Promise<{ data: T; count: number | null }> {
  const candidates = TABLE_CANDIDATES[logicalTable];
  let lastMissingTableError: unknown;

  for (const tableName of candidates) {
    try {
      return await supabaseRequest<T>(`${tableName}${suffix}`, method, body, options);
    } catch (error: unknown) {
      if (isMissingTableError(error, tableName)) {
        lastMissingTableError = error;
        continue;
      }

      throw error;
    }
  }

  throw (
    lastMissingTableError ??
    new Error(`Supabase request failed: No matching table for ${logicalTable}`)
  );
}

export async function listReposByUser(
  userId: string,
  page: number,
  limit: number,
  status?: string
): Promise<RepoListResult> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localListReposByUser(userId, page, limit, status);
  }

  const from = (page - 1) * limit;
  const filters = [`userId=eq.${encode(userId)}`];
  if (status && status !== "all") {
    filters.push(`status=eq.${encode(status)}`);
  }

  const filterQuery = filters.join("&");

  const [reposResult, totalResult] = await Promise.all([
    supabaseRequestWithTableFallback<RepoRow[]>(
      "Repo",
      `?select=*&${filterQuery}&order=createdAt.desc&offset=${from}&limit=${limit}`,
      "GET"
    ),
    supabaseRequestWithTableFallback<{ id: string }[]>("Repo", `?select=id&${filterQuery}`, "GET", undefined, {
      count: "exact",
    }),
  ]);

  return {
    repos: reposResult.data,
    total: totalResult.count ?? reposResult.data.length,
  };
}

export async function getRepoByGithubUrlAndBranch(
  githubUrl: string,
  branch: string,
  userId?: string
): Promise<RepoRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetRepoByGithubUrlAndBranch(githubUrl, branch, userId);
  }

  const userFilter = userId ? `&userId=eq.${encode(userId)}` : "";
  const result = await supabaseRequestWithTableFallback<RepoRow[]>(
    "Repo",
    `?select=*&githubUrl=eq.${encode(githubUrl)}&branch=eq.${encode(branch)}${userFilter}&order=createdAt.desc&limit=1`,
    "GET"
  );

  return result.data[0] ?? null;
}

export async function createRepo(input: {
  userId: string;
  githubUrl: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoStatus;
  shareSlug: string;
}): Promise<RepoRow> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localCreateRepo(input);
  }

  const result = await supabaseRequestWithTableFallback<RepoRow[]>("Repo", "", "POST", input, {
    preferReturnRepresentation: true,
  });
  return result.data[0];
}

export async function createJob(input: {
  repoId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
}): Promise<JobRow> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localCreateJob(input);
  }

  const result = await supabaseRequestWithTableFallback<JobRow[]>("Job", "", "POST", input, {
    preferReturnRepresentation: true,
  });
  return result.data[0];
}

export async function getRepoById(repoId: string): Promise<{ userId: string } | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetRepoById(repoId);
  }

  const result = await supabaseRequestWithTableFallback<Array<{ userId: string }>>(
    "Repo",
    `?select=userId&id=eq.${encode(repoId)}&limit=1`,
    "GET"
  );
  return result.data[0] ?? null;
}

export async function getRepoByIdForUser(repoId: string, userId: string): Promise<RepoRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetRepoByIdForUser(repoId, userId);
  }

  const result = await supabaseRequestWithTableFallback<RepoRow[]>(
    "Repo",
    `?select=*&id=eq.${encode(repoId)}&userId=eq.${encode(userId)}&limit=1`,
    "GET"
  );

  return result.data[0] ?? null;
}

export async function getLatestJobByRepoId(repoId: string): Promise<JobRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetLatestJobByRepoId(repoId);
  }

  const result = await supabaseRequestWithTableFallback<JobRow[]>(
    "Job",
    `?select=*&repoId=eq.${encode(repoId)}&order=createdAt.desc&limit=1`,
    "GET"
  );

  return result.data[0] ?? null;
}

export async function getLatestJobsByRepoIds(repoIds: string[]): Promise<JobRow[]> {
  if (repoIds.length === 0) return [];

  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetLatestJobsByRepoIds(repoIds);
  }

  const ids = repoIds.map((repoId) => encode(repoId)).join(",");
  const result = await supabaseRequestWithTableFallback<JobRow[]>(
    "Job",
    `?select=*&repoId=in.(${ids})&order=createdAt.desc`,
    "GET"
  );
  const latestByRepo = new Map<string, JobRow>();
  for (const job of result.data) {
    if (!latestByRepo.has(job.repoId)) {
      latestByRepo.set(job.repoId, job);
    }
  }

  return [...latestByRepo.values()];
}

export async function getJobById(jobId: string): Promise<JobRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetJobById(jobId);
  }

  const result = await supabaseRequestWithTableFallback<JobRow[]>(
    "Job",
    `?select=*&id=eq.${encode(jobId)}&limit=1`,
    "GET"
  );

  return result.data[0] ?? null;
}

export async function getAnalysisResultByRepoId(repoId: string): Promise<AnalysisResultRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetAnalysisResultByRepoId(repoId);
  }

  const result = await supabaseRequestWithTableFallback<AnalysisResultRow[]>(
    "AnalysisResult",
    `?select=*&repoId=eq.${encode(repoId)}&limit=1`,
    "GET"
  );

  return result.data[0] ?? null;
}

export async function createAnalysisResult(input: AnalysisResultInput): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localCreateAnalysisResult(input);
  }

  await supabaseRequestWithTableFallback<unknown[]>("AnalysisResult", "", "POST", { ...input }, {
    preferReturnRepresentation: false,
  });
}

export async function updateRepo(
  repoId: string,
  updates: Record<string, unknown>
): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localUpdateRepo(repoId, updates);
  }

  await supabaseRequestWithTableFallback<unknown[]>(
    "Repo",
    `?id=eq.${encode(repoId)}`,
    "PATCH",
    updates
  );
}

export async function updateJob(
  jobId: string,
  updates: Record<string, unknown>
): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localUpdateJob(jobId, updates);
  }

  await supabaseRequestWithTableFallback<unknown[]>(
    "Job",
    `?id=eq.${encode(jobId)}`,
    "PATCH",
    updates
  );
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localGetUserById(userId);
  }

  try {
    const result = await supabaseRequestWithTableFallback<UserRow[]>(
      "User",
      `?select=id,plan,creditsRemaining&id=eq.${encode(userId)}&limit=1`,
      "GET"
    );

    return result.data[0] ?? null;
  } catch (error: unknown) {
    if (isMissingTableErrorForAnyCandidate(error, TABLE_CANDIDATES.User)) {
      return null;
    }

    throw error;
  }
}

export async function consumeCreditIfNeeded(userId: string): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localConsumeCreditIfNeeded(userId);
  }

  const user = await getUserById(userId);
  if (!user || user.plan !== "FREE") {
    return;
  }

  if (user.creditsRemaining <= 0) {
    throw new Error("CREDITS_EXHAUSTED: No credits remaining for analysis");
  }

  await supabaseRequestWithTableFallback<unknown[]>(
    "User",
    `?id=eq.${encode(userId)}`,
    "PATCH",
    {
      creditsRemaining: user.creditsRemaining - 1,
    }
  );
}

export async function ensureUserExists(input: UserSeedInput): Promise<void> {
  const sanitizedCredits = Math.max(0, Math.floor(input.creditsRemaining));

  if (shouldUseLocalWorkspaceDatabase()) {
    return localEnsureUserExists({ ...input, creditsRemaining: sanitizedCredits });
  }

  try {
    const existing = await getUserById(input.id);
    if (existing) {
      await supabaseRequestWithTableFallback<unknown[]>(
        "User",
        `?id=eq.${encode(input.id)}`,
        "PATCH",
        {
          email: input.email ?? null,
          name: input.name ?? null,
          image: input.image ?? null,
          githubUsername: input.githubUsername ?? null,
        }
      );
      return;
    }

    await supabaseRequestWithTableFallback<unknown[]>("User", "", "POST", {
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      image: input.image ?? null,
      githubUsername: input.githubUsername ?? null,
      plan: input.plan,
      creditsRemaining: sanitizedCredits,
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return;
    }

    throw error;
  }
}

export async function checkSupabaseDatabaseHealth(): Promise<void> {
  if (shouldUseLocalWorkspaceDatabase()) {
    return localCheckWorkspaceHealth();
  }

  await supabaseRequestWithTableFallback<{ id: string }[]>("Repo", "?select=id&limit=1", "GET");
}
