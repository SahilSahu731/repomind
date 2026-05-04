/**
 * Chrome Storage cache manager.
 * Persists analysis results, auth tokens, and preferences.
 */

import type { AnalysisResult } from "../shared/types";
import { CACHE_TTL_MS } from "../shared/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  /* ─── Analysis Results ─── */

  private analysisKey(owner: string, repo: string): string {
    return `analysis:${owner}/${repo}`;
  }

  async getAnalysis(
    owner: string,
    repo: string
  ): Promise<AnalysisResult | null> {
    return this.get<AnalysisResult>(this.analysisKey(owner, repo));
  }

  async setAnalysis(
    owner: string,
    repo: string,
    data: AnalysisResult
  ): Promise<void> {
    await this.set(this.analysisKey(owner, repo), data, CACHE_TTL_MS);
  }

  /* ─── Auth Token ─── */

  async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get("auth_token");
    return result.auth_token ?? null;
  }

  async setToken(token: string): Promise<void> {
    await chrome.storage.local.set({ auth_token: token });
  }

  async clearToken(): Promise<void> {
    await chrome.storage.local.remove("auth_token");
  }

  /* ─── Chat History ─── */

  async getChatHistory(repoId: string): Promise<unknown[]> {
    const result = await chrome.storage.local.get(`chat:${repoId}`);
    return result[`chat:${repoId}`] ?? [];
  }

  async setChatHistory(repoId: string, history: unknown[]): Promise<void> {
    // Keep only last 50 messages
    const trimmed = history.slice(-50);
    await chrome.storage.local.set({ [`chat:${repoId}`]: trimmed });
  }

  /* ─── Preferences ─── */

  async getPreferences(): Promise<Record<string, unknown>> {
    const result = await chrome.storage.local.get("preferences");
    return result.preferences ?? { theme: "dark" };
  }

  async setPreferences(prefs: Record<string, unknown>): Promise<void> {
    await chrome.storage.local.set({ preferences: prefs });
  }

  /* ─── Generic Helpers ─── */

  private async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    const entry = result[key] as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      await chrome.storage.local.remove(key);
      return null;
    }

    return entry.data;
  }

  private async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await chrome.storage.local.set({ [key]: entry });
  }

  /* ─── Cleanup ─── */

  async cleanup(): Promise<void> {
    const all = await chrome.storage.local.get(null);
    const keysToRemove: string[] = [];

    for (const [key, value] of Object.entries(all)) {
      if (
        key.startsWith("analysis:") &&
        value &&
        typeof value === "object" &&
        "timestamp" in value &&
        "ttl" in value
      ) {
        const entry = value as CacheEntry<unknown>;
        if (Date.now() - entry.timestamp > entry.ttl) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  }
}

export const cache = new CacheManager();
