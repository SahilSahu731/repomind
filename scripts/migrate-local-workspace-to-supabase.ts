import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

interface LocalWorkspace {
  version: 1;
  users: Array<Record<string, unknown>>;
  repos: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
  analysisResults: Array<Record<string, unknown>>;
}

interface LocalAuthUser {
  id: string;
  email: string;
}

const isApply = process.argv.includes("--apply");
const workspacePath = path.join(process.cwd(), ".repomind", "workspace.json");
const authPath = path.join(process.cwd(), ".repomind", "auth-users.json");

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("placeholder") ||
    normalized.startsWith("replace-") ||
    normalized.startsWith("your_") ||
    normalized.startsWith("your-")
  );
}

function getConfiguration() {
  const baseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isPlaceholder(baseUrl) || isPlaceholder(serviceKey)) {
    throw new Error(
      "Set real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values in .env.local before migrating."
    );
  }

  try {
    const hostname = new URL(baseUrl as string).hostname;
    if (!hostname.endsWith(".supabase.co") || hostname === "example.supabase.co") {
      throw new Error("SUPABASE_URL does not look like a Supabase project URL.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase project")) throw error;
    throw new Error("SUPABASE_URL is not a valid URL.");
  }

  return { baseUrl: baseUrl as string, serviceKey: serviceKey as string };
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return fallback;
    throw error;
  }
}

function isWorkspace(value: unknown): value is LocalWorkspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalWorkspace>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.repos) &&
    Array.isArray(candidate.jobs) &&
    Array.isArray(candidate.analysisResults)
  );
}

async function request(
  table: string,
  method: "GET" | "POST",
  configuration: ReturnType<typeof getConfiguration>,
  body?: Array<Record<string, unknown>>,
  select = "id"
): Promise<void> {
  const response = await fetch(
    `${configuration.baseUrl}/rest/v1/${table}${method === "GET" ? `?select=${select}&limit=1` : "?on_conflict=id"}`,
    {
      method,
      headers: {
        apikey: configuration.serviceKey,
        Authorization: `Bearer ${configuration.serviceKey}`,
        "Content-Type": "application/json",
        ...(method === "POST"
          ? { Prefer: "resolution=merge-duplicates,return=minimal" }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(`${table} request failed (${response.status}): ${responseBody}`);
  }
}

async function upsertInChunks(
  table: string,
  rows: Array<Record<string, unknown>>,
  configuration: ReturnType<typeof getConfiguration>
): Promise<void> {
  const chunkSize = 100;
  for (let index = 0; index < rows.length; index += chunkSize) {
    await request(table, "POST", configuration, rows.slice(index, index + chunkSize));
  }
  console.log(`Migrated ${rows.length} ${table} record${rows.length === 1 ? "" : "s"}.`);
}

async function main() {
  const configuration = getConfiguration();
  const rawWorkspace = await readJson<unknown>(workspacePath, null);
  if (!isWorkspace(rawWorkspace)) {
    throw new Error(`No valid local workspace was found at ${workspacePath}.`);
  }

  const localAuthUsers = await readJson<LocalAuthUser[]>(authPath, []);
  const counts = {
    users: rawWorkspace.users.length,
    repos: rawWorkspace.repos.length,
    jobs: rawWorkspace.jobs.length,
    analysisResults: rawWorkspace.analysisResults.length,
  };

  console.log("Local workspace migration plan:");
  console.log(JSON.stringify(counts, null, 2));

  if (localAuthUsers.length > 0) {
    console.warn(
      `Note: ${localAuthUsers.length} local email/password account(s) will not be migrated to Supabase Auth. ` +
        "Those users must sign up or reset their password in Supabase Auth."
    );
  }

  const schemaChecks = [
    ["User", "id,email,name,image,githubUsername,plan,creditsRemaining,createdAt,updatedAt"],
    ["Repo", "id,userId,githubUrl,owner,name,branch,status,shareSlug,totalFiles,totalLines,defaultLanguage,analyzedAt,expiresAt,errorMessage,createdAt,updatedAt"],
    ["Job", "id,repoId,status,progress,currentStep,errorLog,startedAt,completedAt,createdAt,updatedAt"],
    ["AnalysisResult", "id,repoId,summary,architecture,fileTree,dependencyGraph,entryPoints,startGuide,fileSummaries,techStack,contributionScore,createdAt,updatedAt"],
  ] as const;

  for (const [table, columns] of schemaChecks) {
    try {
      await request(table, "GET", configuration, undefined, columns);
    } catch (error) {
      throw new Error(
        `Schema preflight failed for ${table}. Run supabase/schema.sql in the Supabase SQL Editor first. ${String(error)}`
      );
    }
  }
  console.log("Supabase connection and schema preflight passed.");

  if (!isApply) {
    console.log("Dry run only. Re-run with --apply to copy these records to Supabase.");
    return;
  }

  await upsertInChunks("User", rawWorkspace.users, configuration);
  await upsertInChunks("Repo", rawWorkspace.repos, configuration);
  await upsertInChunks("Job", rawWorkspace.jobs, configuration);
  await upsertInChunks("AnalysisResult", rawWorkspace.analysisResults, configuration);
  console.log("Migration complete. Local files were left untouched as a backup.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
