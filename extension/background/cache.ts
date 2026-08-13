import type {
  AnalysisProgress,
  AnalysisResult,
  RepoInfo,
} from "../shared/types";
import { CACHE_TTL_MS } from "../shared/types";
import { repoIdentityKey } from "../shared/github";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface PendingAnalysis {
  jobId: string;
  repoId: string;
  repo: RepoInfo;
  tabId: number | null;
  progress: AnalysisProgress;
}

export interface PendingAuth {
  state: string;
  tabId: number;
  createdAt: number;
}

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user_id";
const PENDING_ANALYSIS_KEY = "pending_analysis";
const PENDING_AUTH_KEY = "pending_auth";
const TAB_REPO_PREFIX = "tab_repo:";
const ANALYSIS_PREFIX = "analysis:v2:";

class CacheManager {
  private async analysisKey(repo: RepoInfo): Promise<string> {
    const userId = await this.getUserId();
    return `${ANALYSIS_PREFIX}${userId ?? "anonymous"}:${repoIdentityKey(repo)}`;
  }

  async getAnalysis(repo: RepoInfo): Promise<AnalysisResult | null> {
    return this.get<AnalysisResult>(await this.analysisKey(repo));
  }

  async setAnalysis(repo: RepoInfo, data: AnalysisResult): Promise<void> {
    try {
      await this.set(await this.analysisKey(repo), data, CACHE_TTL_MS);
    } catch {
      // Large dependency graphs can exceed Chrome's local quota. The live
      // report still works; it simply will not be reused from local cache.
    }
  }

  async clearAnalyses(): Promise<void> {
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter((key) =>
      key.startsWith(ANALYSIS_PREFIX) || key.startsWith("chat:")
    );
    if (keys.length) await chrome.storage.local.remove(keys);
  }

  async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(AUTH_TOKEN_KEY);
    return typeof result[AUTH_TOKEN_KEY] === "string"
      ? result[AUTH_TOKEN_KEY]
      : null;
  }

  async setToken(token: string): Promise<void> {
    await chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token });
  }

  async getUserId(): Promise<string | null> {
    const result = await chrome.storage.local.get(AUTH_USER_KEY);
    return typeof result[AUTH_USER_KEY] === "string"
      ? result[AUTH_USER_KEY]
      : null;
  }

  async setUserId(userId: string): Promise<void> {
    await chrome.storage.local.set({ [AUTH_USER_KEY]: userId });
  }

  async clearToken(): Promise<void> {
    await chrome.storage.local.remove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  }

  async setRepoForTab(tabId: number, repo: RepoInfo): Promise<void> {
    await chrome.storage.session.set({ [`${TAB_REPO_PREFIX}${tabId}`]: repo });
  }

  async getRepoForTab(tabId: number): Promise<RepoInfo | null> {
    const key = `${TAB_REPO_PREFIX}${tabId}`;
    const value = await chrome.storage.session.get(key);
    return (value[key] as RepoInfo | undefined) ?? null;
  }

  async clearRepoForTab(tabId: number): Promise<void> {
    await chrome.storage.session.remove(`${TAB_REPO_PREFIX}${tabId}`);
  }

  async setPendingAnalysis(pending: PendingAnalysis): Promise<void> {
    await chrome.storage.local.set({ [PENDING_ANALYSIS_KEY]: pending });
  }

  async getPendingAnalysis(): Promise<PendingAnalysis | null> {
    const value = await chrome.storage.local.get(PENDING_ANALYSIS_KEY);
    return (value[PENDING_ANALYSIS_KEY] as PendingAnalysis | undefined) ?? null;
  }

  async clearPendingAnalysis(): Promise<void> {
    await chrome.storage.local.remove(PENDING_ANALYSIS_KEY);
  }

  async setPendingAuth(attempt: PendingAuth): Promise<void> {
    await chrome.storage.session.set({ [PENDING_AUTH_KEY]: attempt });
  }

  async getPendingAuth(): Promise<PendingAuth | null> {
    const value = await chrome.storage.session.get(PENDING_AUTH_KEY);
    return (value[PENDING_AUTH_KEY] as PendingAuth | undefined) ?? null;
  }

  async clearPendingAuth(): Promise<void> {
    await chrome.storage.session.remove(PENDING_AUTH_KEY);
  }

  async getChatHistory(repoId: string): Promise<unknown[]> {
    const key = `chat:${repoId}`;
    const result = await chrome.storage.local.get(key);
    return result[key] ?? [];
  }

  async setChatHistory(repoId: string, history: unknown[]): Promise<void> {
    await chrome.storage.local.set({ [`chat:${repoId}`]: history.slice(-50) });
  }

  private async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    const entry = result[key] as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      await chrome.storage.local.remove(key);
      return null;
    }

    return entry.data;
  }

  private async set<T>(key: string, data: T, ttl: number): Promise<void> {
    await chrome.storage.local.set({
      [key]: { data, timestamp: Date.now(), ttl } satisfies CacheEntry<T>,
    });
  }

  async cleanup(): Promise<void> {
    const all = await chrome.storage.local.get(null);
    const expiredKeys = Object.entries(all).flatMap(([key, value]) => {
      if (
        !key.startsWith(ANALYSIS_PREFIX) ||
        !value ||
        typeof value !== "object" ||
        !("timestamp" in value) ||
        !("ttl" in value)
      ) {
        return [];
      }

      const entry = value as CacheEntry<unknown>;
      return Date.now() - entry.timestamp > entry.ttl ? [key] : [];
    });

    if (expiredKeys.length) await chrome.storage.local.remove(expiredKeys);
  }
}

export const cache = new CacheManager();
