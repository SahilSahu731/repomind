/**
 * API Client for the RepoMind backend.
 * All HTTP calls to the Next.js API go through here.
 */

import type { RepoInfo, AnalysisProgress, AnalysisResult, UserInfo } from "../shared/types";
import { API_BASE_URL } from "../shared/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseUrl = API_BASE_URL;

  private async fetch<T>(
    path: string,
    options: RequestInit & { token?: string | null } = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;

    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...fetchOptions,
        credentials: "omit",
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("RepoMind took too long to respond", 408, "TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        body?.error?.message || `API error: ${res.status} ${res.statusText}`,
        res.status,
        body?.error?.code || "API_ERROR"
      );
    }

    return res.json();
  }

  /* ─── Analysis ─── */

  async startAnalysis(
    repo: RepoInfo,
    token: string | null
  ): Promise<{ jobId: string; repoId: string; cached: boolean }> {
    const data = await this.fetch<{
      success: boolean;
      data: { jobId: string; repoId: string; cached?: boolean };
    }>("/api/ext/analyze", {
      method: "POST",
      token,
      body: JSON.stringify({
        owner: repo.owner,
        repo: repo.repo,
        branch: repo.branch,
        githubUrl: repo.url,
        metadata: {
          description: repo.description,
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language,
          topics: repo.topics,
        },
      }),
    });

    return {
      jobId: data.data.jobId,
      repoId: data.data.repoId,
      cached: data.data.cached ?? false,
    };
  }

  async getStatus(
    jobId: string,
    token: string | null
  ): Promise<AnalysisProgress> {
    const data = await this.fetch<{ success: boolean; data: AnalysisProgress }>(
      `/api/ext/status/${jobId}`,
      { token }
    );
    return data.data;
  }

  async getResults(
    repoId: string,
    token: string | null
  ): Promise<AnalysisResult> {
    const data = await this.fetch<{
      success: boolean;
      data: AnalysisResult;
    }>(`/api/ext/results/${repoId}`, { token });
    return data.data;
  }

  /* ─── Chat ─── */

  async chat(
    repoId: string,
    message: string,
    history: unknown[],
    token: string | null
  ): Promise<string> {
    const data = await this.fetch<{ success: boolean; data: { response: string } }>(
      "/api/ext/chat",
      {
        method: "POST",
        token,
        body: JSON.stringify({ repoId, message, history }),
      }
    );
    return data.data.response;
  }

  /* ─── Compare ─── */

  async compare(
    repoA: { owner: string; repo: string },
    repoB: { owner: string; repo: string },
    token: string | null
  ): Promise<unknown> {
    const data = await this.fetch<{ success: boolean; data: unknown }>(
      "/api/ext/compare",
      {
        method: "POST",
        token,
        body: JSON.stringify({ repoA, repoB }),
      }
    );
    return data.data;
  }

  /* ─── Auth ─── */

  async getUser(token: string): Promise<UserInfo> {
    const data = await this.fetch<{ success: boolean; data: UserInfo }>(
      "/api/ext/auth/me",
      { token }
    );
    return data.data;
  }
}

export const apiClient = new ApiClient();
