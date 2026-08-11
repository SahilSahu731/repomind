import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import {
  getLatestJobsByRepoIds,
  getUserById,
  listReposByUser,
  type RepoRow,
} from "@/lib/supabaseDb";
import type {
  AccountActivityItem,
  AccountOverview,
  AccountRepository,
} from "@/types/account";

const ACTIVE_STATUSES = new Set<RepoRow["status"]>([
  "QUEUED",
  "CLONING",
  "PARSING",
  "ANALYZING",
]);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const error = getApiError("UNAUTHORIZED");
      return fail(error.code, error.message, error.status);
    }

    const [storedUser, repositoryResult] = await Promise.all([
      getUserById(session.user.id),
      listReposByUser(session.user.id, 1, 200, "all"),
    ]);

    const latestJobs = await getLatestJobsByRepoIds(
      repositoryResult.repos.map((repo) => repo.id)
    );
    const latestJobByRepo = new Map(latestJobs.map((job) => [job.repoId, job]));
    const repositories: AccountRepository[] = repositoryResult.repos.map((repo) => ({
      ...repo,
      latestJob: latestJobByRepo.get(repo.id) ?? null,
    }));

    const reportsReady = repositories.filter((repo) => repo.status === "COMPLETE").length;
    const needsAttention = repositories.filter((repo) => repo.status === "FAILED").length;
    const inProgress = repositories.filter((repo) => ACTIVE_STATUSES.has(repo.status)).length;
    const totalFiles = repositories.reduce((total, repo) => total + (repo.totalFiles ?? 0), 0);
    const totalLines = repositories.reduce((total, repo) => total + (repo.totalLines ?? 0), 0);
    const uniqueOwners = new Set(repositories.map((repo) => repo.owner.toLowerCase())).size;
    const terminalCount = reportsReady + needsAttention;
    const completionRate = terminalCount > 0
      ? Math.round((reportsReady / terminalCount) * 100)
      : 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeDays = new Set(
      repositories
        .map((repo) => repo.analyzedAt ?? repo.createdAt)
        .filter((value) => Date.parse(value) >= thirtyDaysAgo)
        .map((value) => value.slice(0, 10))
    ).size;

    const languageCounts = new Map<string, number>();
    for (const repo of repositories) {
      if (repo.defaultLanguage) {
        languageCounts.set(
          repo.defaultLanguage,
          (languageCounts.get(repo.defaultLanguage) ?? 0) + 1
        );
      }
    }

    const detectedLanguageTotal = [...languageCounts.values()].reduce(
      (total, count) => total + count,
      0
    );
    const languages = [...languageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: detectedLanguageTotal > 0
          ? Math.round((count / detectedLanguageTotal) * 100)
          : 0,
      }));

    const activity: AccountActivityItem[] = repositories
      .map((repo) => ({
        id: `${repo.id}-${repo.latestJob?.id ?? "repository"}`,
        repoId: repo.id,
        owner: repo.owner,
        name: repo.name,
        branch: repo.branch,
        status: repo.status,
        progress: repo.latestJob?.progress ?? (repo.status === "COMPLETE" ? 100 : 0),
        currentStep: repo.latestJob?.currentStep ?? null,
        occurredAt:
          repo.latestJob?.completedAt ??
          repo.analyzedAt ??
          repo.createdAt,
      }))
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

    const overview: AccountOverview = {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        githubUsername: session.user.githubUsername ?? null,
        plan: storedUser?.plan ?? session.user.plan,
        creditsRemaining:
          storedUser?.creditsRemaining ?? session.user.creditsRemaining,
      },
      summary: {
        totalRepositories: repositoryResult.total,
        reportsReady,
        inProgress,
        needsAttention,
        totalFiles,
        totalLines,
        uniqueOwners,
        activeDays,
        completionRate,
        topLanguage: languages[0]?.name ?? null,
      },
      languages,
      repositories: repositories.slice(0, 12),
      activity: activity.slice(0, 30),
      generatedAt: new Date().toISOString(),
    };

    return ok(overview);
  } catch {
    const error = getApiError(
      "ANALYSIS_FAILED",
      "Your account overview could not be loaded"
    );
    return fail(error.code, error.message, error.status);
  }
}
