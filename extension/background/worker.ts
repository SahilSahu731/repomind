import type {
  AnalysisProgress,
  Message,
  RepoInfo,
} from "../shared/types";
import { API_BASE_URL } from "../shared/types";
import { repoIdentityKey } from "../shared/github";
import { apiClient, ApiError } from "./api";
import { cache, type PendingAnalysis } from "./cache";

const POLL_ALARM = "repomind-analysis-poll";
const POLL_PERIOD_MINUTES = 0.5;
let pollInFlight = false;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  void initializeStorageSecurity();
  void cache.cleanup();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeStorageSecurity();
  void resumePendingAnalysis();
});

void initializeStorageSecurity();
void resumePendingAnalysis();

// Keep the panel-open request in a dedicated synchronous listener. Chrome's
// transient user activation is propagated from the content-script click only
// for the immediate message event; routing through unrelated async work can
// make sidePanel.open() look like it was not triggered by the user.
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type !== "OPEN_SIDE_PANEL") return false;

  const tabId = sender.tab?.id;
  if (tabId === undefined) {
    sendResponse({ ok: false, error: "Open RepoMind from a GitHub repository tab" });
    return false;
  }

  chrome.sidePanel.open({ tabId })
    .then(async () => {
      await broadcastContextForTab(tabId);
      sendResponse({ ok: true });
    })
    .catch((error: unknown) => {
      console.warn("[RepoMind] Could not open the side panel", error);
      sendResponse({
        ok: false,
        error: errorMessage(error) || "Chrome could not open the RepoMind side panel",
      });
    });

  return true;
});

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === "OPEN_SIDE_PANEL") return false;

  void handleMessage(message, sender)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse({ ok: false, error: errorMessage(error) });
    });
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) void pollPendingAnalysis();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void broadcastContextForTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) void completeTabLogin(tabId, changeInfo.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void cache.clearRepoForTab(tabId);
  void clearClosedAuthAttempt(tabId);
});

async function initializeStorageSecurity(): Promise<void> {
  try {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  } catch {
    // Older Chromium versions may not expose setAccessLevel. The manifest's
    // minimum version supports it, so this is only defensive.
  }
}

async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case "DETECT_REPO": {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return { ok: false, error: "Repository tab unavailable" };

      const repo = message.payload as RepoInfo;
      await cache.setRepoForTab(tabId, repo);

      if (sender.tab?.active) {
        await broadcastContextForTab(tabId);
      }
      return { ok: true };
    }

    case "CLEAR_REPO": {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return { ok: false };
      await cache.clearRepoForTab(tabId);
      if (sender.tab?.active) {
        broadcast({
          type: "CONTEXT_UPDATED",
          payload: { tabId, repo: null, analysis: null },
        });
      }
      return { ok: true };
    }

    case "GET_CONTEXT":
    case "GET_CACHED_ANALYSIS": {
      const tabId = await resolveActiveTabId();
      if (tabId === null) return { repo: null, analysis: null, progress: null };

      const repo = await cache.getRepoForTab(tabId);
      const analysis = repo ? await cache.getAnalysis(repo) : null;
      const pending = await cache.getPendingAnalysis();
      const progress = pending && repo && pending.tabId === tabId
        && repoIdentityKey(pending.repo) === repoIdentityKey(repo)
        ? pending.progress
        : null;
      return { repo, analysis, progress, tabId };
    }

    case "START_ANALYSIS": {
      const repo = message.payload as RepoInfo;
      const senderTabId = sender.tab?.id;
      // Backward compatibility for GitHub tabs that still have the previous
      // content script loaded after an extension update. Invoke open before any
      // await so those clicks retain their user activation too.
      const panelOpen = senderTabId === undefined
        ? null
        : chrome.sidePanel.open({ tabId: senderTabId });
      const tabId = senderTabId ?? await resolveActiveTabId();
      if (tabId !== null) {
        await cache.setRepoForTab(tabId, repo);
      }
      if (panelOpen) {
        await panelOpen.catch((error: unknown) => {
          console.warn("[RepoMind] Could not open the side panel", error);
        });
      }

      const cached = await cache.getAnalysis(repo);
      if (cached) {
        broadcast({ type: "ANALYSIS_COMPLETE", payload: cached });
        return { ok: true, cached: true };
      }

      const pending = await cache.getPendingAnalysis();
      if (pending) {
        if (repoIdentityKey(pending.repo) === repoIdentityKey(repo)) {
          if (await isPendingContextActive(pending)) {
            broadcast({ type: "ANALYSIS_PROGRESS", payload: pending.progress });
          }
          void pollPendingAnalysis();
          return { ok: true, alreadyRunning: true };
        }

        throw new ApiError(
          `RepoMind is already analyzing ${pending.repo.owner}/${pending.repo.repo}. Let it finish before starting another repository.`,
          409,
          "ANALYSIS_IN_PROGRESS"
        );
      }

      const token = await requireToken();
      try {
        const result = await apiClient.startAnalysis(repo, token);

        if (result.cached) {
          const analysis = await apiClient.getResults(result.repoId, token);
          await cache.setAnalysis(repo, analysis);
          broadcast({ type: "ANALYSIS_COMPLETE", payload: analysis });
          return { ok: true, cached: true };
        }

        const progress: AnalysisProgress = {
          jobId: result.jobId,
          repoId: result.repoId,
          status: "QUEUED",
          progress: 0,
          currentStep: "queued",
        };
        await cache.setPendingAnalysis({
          jobId: result.jobId,
          repoId: result.repoId,
          repo,
          tabId,
          progress,
        });
        await ensurePollAlarm();
        broadcast({ type: "ANALYSIS_PROGRESS", payload: progress });
        void pollPendingAnalysis();
        return { ok: true };
      } catch (error) {
        await handleApiAuthFailure(error);
        throw error;
      }
    }

    case "POLL_ANALYSIS":
      await pollPendingAnalysis();
      return { ok: true };

    case "CHAT_MESSAGE": {
      const { repoId, message: userMessage, history } = message.payload as {
        repoId: string;
        message: string;
        history: unknown[];
      };
      const token = await requireToken();
      try {
        const response = await apiClient.chat(repoId, userMessage, history, token);
        return { ok: true, response };
      } catch (error) {
        await handleApiAuthFailure(error);
        throw error;
      }
    }

    case "COMPARE_REPOS": {
      const { repoA, repoB } = message.payload as {
        repoA: { owner: string; repo: string };
        repoB: { owner: string; repo: string };
      };
      const token = await requireToken();
      try {
        const result = await apiClient.compare(repoA, repoB, token);
        return { ok: true, result };
      } catch (error) {
        await handleApiAuthFailure(error);
        throw error;
      }
    }

    case "LOGIN":
      return startTabLogin();

    case "LOGOUT":
      await cache.clearAnalyses();
      await cache.clearPendingAnalysis();
      await cache.clearPendingAuth();
      await stopPollAlarm();
      await cache.clearToken();
      broadcast({ type: "AUTH_STATUS", payload: { isLoggedIn: false } });
      return { ok: true };

    case "GET_AUTH": {
      const token = await cache.getToken();
      if (!token) return { isLoggedIn: false };

      try {
        const user = await apiClient.getUser(token);
        await cache.setUserId(user.id);
        return { isLoggedIn: true, user };
      } catch (error) {
        await handleApiAuthFailure(error);
        return { isLoggedIn: false, error: errorMessage(error) };
      }
    }

    default:
      return { ok: false, error: "Unknown message type" };
  }
}

async function startTabLogin(): Promise<{ ok: true }> {
  const existing = await cache.getPendingAuth();
  if (existing && Date.now() - existing.createdAt < 10 * 60 * 1000) {
    try {
      await chrome.tabs.update(existing.tabId, { active: true });
      return { ok: true };
    } catch {
      await cache.clearPendingAuth();
    }
  }

  const stateBytes = crypto.getRandomValues(new Uint8Array(24));
  const state = bytesToBase64Url(stateBytes);
  const loginUrl = new URL("/api/ext/auth/login", API_BASE_URL);
  loginUrl.searchParams.set("state", state);
  loginUrl.searchParams.set("flow", "tab");
  loginUrl.searchParams.set("extension_id", chrome.runtime.id);

  let tabId: number | undefined;
  try {
    const tab = await chrome.tabs.create({ active: true });
    if (tab.id === undefined) throw new Error("Chrome did not create a sign-in tab");
    tabId = tab.id;
    await cache.setPendingAuth({ state, tabId, createdAt: Date.now() });
    await chrome.tabs.update(tabId, { url: loginUrl.toString(), active: true });
  } catch (error) {
    await cache.clearPendingAuth();
    if (tabId !== undefined) await chrome.tabs.remove(tabId).catch(() => {});
    const message = chrome.runtime.lastError?.message || errorMessage(error);
    broadcast({ type: "AUTH_ERROR", payload: { error: message } });
    throw new Error(message);
  }

  return { ok: true };
}

async function completeTabLogin(tabId: number, rawUrl: string): Promise<void> {
  const completionUrl = new URL("/api/ext/auth/complete", API_BASE_URL);
  let callback: URL;
  try {
    callback = new URL(rawUrl);
  } catch {
    return;
  }

  if (callback.origin !== completionUrl.origin || callback.pathname !== completionUrl.pathname) {
    return;
  }

  const attempt = await cache.getPendingAuth();
  if (!attempt || attempt.tabId !== tabId) return;

  const fragment = new URLSearchParams(callback.hash.slice(1));
  const returnedState = fragment.get("state");
  const token = fragment.get("token");

  if (returnedState !== attempt.state || !token) {
    await cache.clearPendingAuth();
    broadcast({
      type: "AUTH_ERROR",
      payload: { error: "RepoMind could not verify the sign-in response" },
    });
    return;
  }

  await cache.clearPendingAuth();
  await cache.setToken(token);
  let user;
  try {
    user = await apiClient.getUser(token);
  } catch (error) {
    await cache.clearToken();
    broadcast({ type: "AUTH_ERROR", payload: { error: errorMessage(error) } });
    return;
  }
  await cache.setUserId(user.id);
  broadcast({ type: "AUTH_STATUS", payload: { isLoggedIn: true, user } });
  await chrome.tabs.remove(tabId).catch(() => {});
}

async function clearClosedAuthAttempt(tabId: number): Promise<void> {
  const attempt = await cache.getPendingAuth();
  if (attempt?.tabId === tabId) {
    await cache.clearPendingAuth();
    broadcast({
      type: "AUTH_ERROR",
      payload: { error: "Sign-in was cancelled before it completed" },
    });
  }
}

async function resumePendingAnalysis(): Promise<void> {
  if (await cache.getPendingAnalysis()) {
    await ensurePollAlarm();
    await pollPendingAnalysis();
  }
}

async function ensurePollAlarm(): Promise<void> {
  const alarm = await chrome.alarms.get(POLL_ALARM);
  if (!alarm) {
    await chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_PERIOD_MINUTES });
  }
}

async function stopPollAlarm(): Promise<void> {
  await chrome.alarms.clear(POLL_ALARM);
}

async function pollPendingAnalysis(): Promise<void> {
  if (pollInFlight) return;
  pollInFlight = true;

  try {
    await runPendingAnalysisPoll();
  } finally {
    pollInFlight = false;
  }
}

async function runPendingAnalysisPoll(): Promise<void> {
  const pending = await cache.getPendingAnalysis();
  if (!pending) {
    await stopPollAlarm();
    return;
  }

  try {
    const token = await requireToken();
    const progress = await apiClient.getStatus(pending.jobId, token);
    const updated: PendingAnalysis = { ...pending, progress };
    await cache.setPendingAnalysis(updated);
    if (await isPendingContextActive(updated)) {
      broadcast({ type: "ANALYSIS_PROGRESS", payload: progress });
    }

    if (progress.status === "COMPLETED") {
      const analysis = await apiClient.getResults(pending.repoId, token);
      await cache.setAnalysis(pending.repo, analysis);
      await cache.clearPendingAnalysis();
      await stopPollAlarm();
      if (await isPendingContextActive(updated)) {
        broadcast({ type: "ANALYSIS_COMPLETE", payload: analysis });
      }

      if (pending.tabId !== null) {
        await chrome.tabs.sendMessage(pending.tabId, {
          type: "INJECT_BADGES",
          payload: {
            contributionScore: analysis.contributionScore?.total,
            techStack: analysis.techStack.frameworks,
          },
        }).catch(() => {});
      }
      return;
    }

    if (progress.status === "FAILED" || progress.status === "TIMEOUT") {
      await cache.clearPendingAnalysis();
      await stopPollAlarm();
      if (await isPendingContextActive(updated)) {
        broadcast({
          type: "ANALYSIS_ERROR",
          payload: {
            error: progress.status === "TIMEOUT"
              ? "Analysis timed out. Please try again."
              : "Analysis could not be completed. Please try again.",
          },
        });
      }
    }
  } catch (error) {
    await handleApiAuthFailure(error);
    if (error instanceof ApiError && error.status === 401) {
      await cache.clearPendingAnalysis();
      await stopPollAlarm();
      if (await isPendingContextActive(pending)) {
        broadcast({ type: "ANALYSIS_ERROR", payload: { error: "Your session expired. Sign in again to continue." } });
      }
    }
  }
}

async function broadcastContextForTab(tabId: number): Promise<void> {
  const repo = await cache.getRepoForTab(tabId);
  const analysis = repo ? await cache.getAnalysis(repo) : null;
  const pending = await cache.getPendingAnalysis();
  const progress = pending && repo && pending.tabId === tabId
    && repoIdentityKey(pending.repo) === repoIdentityKey(repo)
    ? pending.progress
    : null;
  broadcast({ type: "CONTEXT_UPDATED", payload: { tabId, repo, analysis, progress } });
}

async function isPendingContextActive(pending: PendingAnalysis): Promise<boolean> {
  if (pending.tabId === null || pending.tabId !== await resolveActiveTabId()) return false;
  const repo = await cache.getRepoForTab(pending.tabId);
  return Boolean(repo && repoIdentityKey(repo) === repoIdentityKey(pending.repo));
}

async function resolveActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function requireToken(): Promise<string> {
  const token = await cache.getToken();
  if (!token) throw new ApiError("Sign in to RepoMind to continue", 401, "UNAUTHORIZED");
  return token;
}

async function handleApiAuthFailure(error: unknown): Promise<void> {
  if (error instanceof ApiError && error.status === 401) {
    await cache.clearToken();
    broadcast({ type: "AUTH_STATUS", payload: { isLoggedIn: false } });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function broadcast(message: Message): void {
  chrome.runtime.sendMessage(message).catch(() => {});
}
