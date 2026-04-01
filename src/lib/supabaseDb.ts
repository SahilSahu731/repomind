import { env } from "@/lib/env";

type RequestMethod = "GET" | "POST" | "PATCH";

export type Plan = "FREE" | "PRO" | "ENTERPRISE";
export type RepoStatus = "QUEUED" | "CLONING" | "PARSING" | "ANALYZING" | "COMPLETE" | "FAILED";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "TIMEOUT";

interface SupabaseQueryOptions {
  count?: "exact";
  select?: string;
  preferReturnRepresentation?: boolean;
}

interface UserRow {
  id: string;
  plan: Plan;
  creditsRemaining: number;
}

interface RepoRow {
  id: string;
  userId: string;
  githubUrl: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoStatus;
  expiresAt: string | null;
  createdAt: string;
}

interface JobRow {
  id: string;
  repoId: string;
  status: JobStatus;
  progress: number;
  currentStep: string | null;
  createdAt: string;
}

interface RepoListResult {
  repos: RepoRow[];
  total: number;
}

function getDatabaseConfig() {
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;

  if (!baseUrl || !serviceKey) {
    throw new Error("Supabase database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).");
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

export async function listReposByUser(
  userId: string,
  page: number,
  limit: number,
  status?: string
): Promise<RepoListResult> {
  const from = (page - 1) * limit;
  const filters = [`userId=eq.${encode(userId)}`];
  if (status && status !== "all") {
    filters.push(`status=eq.${encode(status)}`);
  }

  const filterQuery = filters.join("&");

  const [reposResult, totalResult] = await Promise.all([
    supabaseRequest<RepoRow[]>(
      `Repo?select=*&${filterQuery}&order=createdAt.desc&offset=${from}&limit=${limit}`,
      "GET"
    ),
    supabaseRequest<{ id: string }[]>(`Repo?select=id&${filterQuery}`, "GET", undefined, {
      count: "exact",
    }),
  ]);

  return {
    repos: reposResult.data,
    total: totalResult.count ?? reposResult.data.length,
  };
}

export async function getRepoByGithubUrlAndBranch(githubUrl: string, branch: string): Promise<RepoRow | null> {
  const result = await supabaseRequest<RepoRow[]>(
    `Repo?select=*&githubUrl=eq.${encode(githubUrl)}&branch=eq.${encode(branch)}&limit=1`,
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
  const result = await supabaseRequest<RepoRow[]>("Repo", "POST", input, {
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
  const result = await supabaseRequest<JobRow[]>("Job", "POST", input, {
    preferReturnRepresentation: true,
  });
  return result.data[0];
}

export async function getRepoById(repoId: string): Promise<{ userId: string } | null> {
  const result = await supabaseRequest<Array<{ userId: string }>>(
    `Repo?select=userId&id=eq.${encode(repoId)}&limit=1`,
    "GET"
  );
  return result.data[0] ?? null;
}

export async function createAnalysisResult(input: Record<string, unknown>): Promise<void> {
  await supabaseRequest<unknown[]>("AnalysisResult", "POST", input, {
    preferReturnRepresentation: false,
  });
}

export async function updateRepo(
  repoId: string,
  updates: Record<string, unknown>
): Promise<void> {
  await supabaseRequest<unknown[]>(`Repo?id=eq.${encode(repoId)}`, "PATCH", updates);
}

export async function updateJob(
  jobId: string,
  updates: Record<string, unknown>
): Promise<void> {
  await supabaseRequest<unknown[]>(`Job?id=eq.${encode(jobId)}`, "PATCH", updates);
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  const result = await supabaseRequest<UserRow[]>(
    `User?select=id,plan,creditsRemaining&id=eq.${encode(userId)}&limit=1`,
    "GET"
  );
  return result.data[0] ?? null;
}

export async function consumeCreditIfNeeded(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user || user.plan !== "FREE") {
    return;
  }

  if (user.creditsRemaining <= 0) {
    throw new Error("CREDITS_EXHAUSTED: No credits remaining for analysis");
  }

  await supabaseRequest<unknown[]>(`User?id=eq.${encode(userId)}`, "PATCH", {
    creditsRemaining: user.creditsRemaining - 1,
  });
}

export async function checkSupabaseDatabaseHealth(): Promise<void> {
  await supabaseRequest<{ id: string }[]>("Repo?select=id&limit=1", "GET");
}
