/**
 * RepoMind Background Service Worker
 *
 * Central hub: handles tab detection, side panel control,
 * API communication, caching, and message routing.
 */

import type { Message, RepoInfo, AnalysisProgress, AnalysisResult } from "../shared/types";
import { API_BASE_URL } from "../shared/types";
import { apiClient } from "./api";
import { cache } from "./cache";

/* ─── Side Panel Behavior ─── */

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

/* ─── State ─── */

let currentRepo: RepoInfo | null = null;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

/* ─── Message Handling ─── */

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // keep channel open for async response
  }
);

async function handleMessage(
  message: Message,
  sendResponse: (response?: unknown) => void
): Promise<void> {
  switch (message.type) {
    case "DETECT_REPO": {
      currentRepo = message.payload as RepoInfo;
      // Forward to side panel
      broadcastToPanel({ type: "REPO_DETECTED", payload: currentRepo });
      // Check if we have cached results
      const cached = await cache.getAnalysis(
        currentRepo.owner,
        currentRepo.repo
      );
      if (cached) {
        broadcastToPanel({ type: "ANALYSIS_COMPLETE", payload: cached });
      }
      sendResponse({ ok: true });
      break;
    }

    case "START_ANALYSIS": {
      const repo = message.payload as RepoInfo;
      currentRepo = repo;

      // Open side panel on the current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      }

      // Check cache first
      const cachedResult = await cache.getAnalysis(repo.owner, repo.repo);
      if (cachedResult) {
        broadcastToPanel({ type: "ANALYSIS_COMPLETE", payload: cachedResult });
        sendResponse({ ok: true, cached: true });
        return;
      }

      // Start analysis via API
      try {
        const token = await cache.getToken();
        const result = await apiClient.startAnalysis(repo, token);

        if (result.cached && result.repoId) {
          // Fetch full results
          const full = await apiClient.getResults(result.repoId, token);
          if (full) {
            await cache.setAnalysis(repo.owner, repo.repo, full);
            broadcastToPanel({ type: "ANALYSIS_COMPLETE", payload: full });
          }
        } else if (result.jobId) {
          // Start polling for progress
          startPolling(result.jobId, result.repoId, repo);
          broadcastToPanel({
            type: "ANALYSIS_PROGRESS",
            payload: {
              jobId: result.jobId,
              repoId: result.repoId,
              status: "QUEUED",
              progress: 0,
              currentStep: "queued",
            } satisfies AnalysisProgress,
          });
        }

        sendResponse({ ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        broadcastToPanel({
          type: "ANALYSIS_ERROR",
          payload: { error: msg },
        });
        sendResponse({ ok: false, error: msg });
      }
      break;
    }

    case "GET_CACHED_ANALYSIS": {
      if (currentRepo) {
        const cached = await cache.getAnalysis(
          currentRepo.owner,
          currentRepo.repo
        );
        sendResponse({ repo: currentRepo, analysis: cached ?? null });
      } else {
        sendResponse({ repo: null, analysis: null });
      }
      break;
    }

    case "CHAT_MESSAGE": {
      const { repoId, message: userMsg, history } = message.payload as {
        repoId: string;
        message: string;
        history: unknown[];
      };
      try {
        const token = await cache.getToken();
        const response = await apiClient.chat(repoId, userMsg, history, token);
        sendResponse({ ok: true, response });
      } catch {
        sendResponse({ ok: false, error: "Chat failed" });
      }
      break;
    }

    case "LOGIN": {
      // Open auth page in a new tab
      chrome.tabs.create({ url: `${API_BASE_URL}/api/ext/auth/login` });
      sendResponse({ ok: true });
      break;
    }

    case "LOGOUT": {
      await cache.clearToken();
      broadcastToPanel({
        type: "AUTH_STATUS",
        payload: { isLoggedIn: false },
      });
      sendResponse({ ok: true });
      break;
    }

    case "GET_AUTH": {
      const token = await cache.getToken();
      if (token) {
        try {
          const user = await apiClient.getUser(token);
          sendResponse({ isLoggedIn: true, user });
        } catch {
          sendResponse({ isLoggedIn: false });
        }
      } else {
        sendResponse({ isLoggedIn: false });
      }
      break;
    }

    default:
      sendResponse({ ok: false, error: "Unknown message type" });
  }
}

/* ─── Polling ─── */

function startPolling(
  jobId: string,
  repoId: string,
  repo: RepoInfo
): void {
  stopPolling();

  pollingInterval = setInterval(async () => {
    try {
      const token = await cache.getToken();
      const status = await apiClient.getStatus(jobId, token);

      broadcastToPanel({
        type: "ANALYSIS_PROGRESS",
        payload: status,
      });

      if (
        status.status === "COMPLETED" ||
        status.status === "FAILED" ||
        status.status === "TIMEOUT"
      ) {
        stopPolling();

        if (status.status === "COMPLETED") {
          const results = await apiClient.getResults(repoId, token);
          if (results) {
            await cache.setAnalysis(repo.owner, repo.repo, results);
            broadcastToPanel({
              type: "ANALYSIS_COMPLETE",
              payload: results,
            });

            // Also tell content script to inject badges
            const [tab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (tab?.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: "INJECT_BADGES",
                payload: {
                  contributionScore:
                    results.contributionScore?.total,
                  techStack: results.techStack?.frameworks,
                },
              });
            }
          }
        }
      }
    } catch {
      // Polling error — will retry next interval
    }
  }, 2000);
}

function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/* ─── Broadcast Helpers ─── */

function broadcastToPanel(message: Message): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // Panel might not be open yet
  });
}

/* ─── Tab Change Detection ─── */

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url && changeInfo.url.includes("github.com")) {
    // Content script will handle detection
  }
});

/* ─── Handle auth callback from web ─── */

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (
    changeInfo.url &&
    changeInfo.url.startsWith(`${API_BASE_URL}/api/ext/auth/callback`)
  ) {
    const url = new URL(changeInfo.url);
    const token = url.searchParams.get("token");
    if (token) {
      cache.setToken(token).then(() => {
        // Close the auth tab
        if (tab.id) chrome.tabs.remove(tab.id);
        // Notify panel
        broadcastToPanel({
          type: "AUTH_STATUS",
          payload: { isLoggedIn: true },
        });
      });
    }
  }
});
