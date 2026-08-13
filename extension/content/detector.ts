import type { Message, RepoInfo } from "../shared/types";
import {
  parseGitHubRepositoryUrl,
  repoIdentityKey,
} from "../shared/github";

const CONTROL_ID = "repomind-repository-control";
const BADGE_ID = "repomind-analysis-badge";
const DEFAULT_BRANCH_SELECTOR = [
  '[data-testid="branch-name"]',
  'button[data-hotkey="w"] span[data-component="text"]',
  'button[aria-label*="Switch branches or tags"] span',
  '[id^="branch-picker"] span',
].join(",");

let currentIdentity: string | null = null;
let currentInfo: RepoInfo | null = null;
let detectTimer: number | null = null;
let lastReportedIdentity: string | null | undefined;

function detectBranchFromPage(): string | null {
  const defaultBranch = document.querySelector<HTMLMetaElement>(
    'meta[name="octolytics-dimension-repository_default_branch"]'
  )?.content?.trim();
  const element = document.querySelector<HTMLElement>(DEFAULT_BRANCH_SELECTOR);
  const currentBranch = element?.textContent?.trim();
  const value = currentBranch || (
    window.location.pathname.includes("/tree/") ? null : defaultBranch
  );
  return value && value.length <= 255 ? value : null;
}

function detectRepository(): RepoInfo | null {
  const info = parseGitHubRepositoryUrl(window.location.href, detectBranchFromPage());
  if (!info) return null;

  try {
    const description = document.querySelector<HTMLElement>(
      '[data-testid="about-description"], .f4.my-3, p.f4.my-3'
    )?.textContent?.trim();
    if (description) info.description = description;

    info.stars = readCompactCount(
      document.querySelector<HTMLElement>(
        '#repo-stars-counter-star, a[href$="/stargazers"] .Counter'
      )?.textContent
    );
    info.forks = readCompactCount(
      document.querySelector<HTMLElement>(
        '#repo-network-counter, a[href$="/forks"] .Counter'
      )?.textContent
    );

    const language = document.querySelector<HTMLElement>(
      '[itemprop="programmingLanguage"]'
    )?.textContent?.trim();
    if (language) info.language = language;

    const topics = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a.topic-tag, a[data-octo-click="topic_click"]')
    ).map((element) => element.textContent?.trim() ?? "").filter(Boolean);
    if (topics.length) info.topics = topics;
  } catch {
    // DOM metadata is helpful but never required for repository analysis.
  }

  return info;
}

function readCompactCount(value: string | null | undefined): number | undefined {
  const normalized = value?.trim().toLowerCase().replace(/,/g, "");
  if (!normalized) return undefined;

  const match = normalized.match(/^([\d.]+)([km])?$/);
  if (!match) return undefined;

  const number = Number(match[1]);
  if (!Number.isFinite(number)) return undefined;
  const multiplier = match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : 1;
  return Math.round(number * multiplier);
}

function brandMark(): string {
  return `
    <svg viewBox="0 0 40 40" aria-hidden="true" fill="none">
      <path d="M8 8h10v10H8V8Z" fill="currentColor"/>
      <path d="M22 8h10v10H22V8Z" fill="currentColor" opacity=".42"/>
      <path d="M8 22h10v10H8V22Z" fill="currentColor" opacity=".42"/>
      <path d="M22 22h10v10H22V22Z" fill="currentColor"/>
      <path d="M18 13h4M13 18v4M27 18v4M18 27h4" stroke="currentColor" stroke-width="2"/>
    </svg>`;
}

function injectRepositoryControl(info: RepoInfo): void {
  document.getElementById(CONTROL_ID)?.remove();

  const host = document.createElement("div");
  host.id = CONTROL_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { position: fixed; right: 24px; bottom: 24px; z-index: 2147483646; }
    button {
      appearance: none; display: inline-flex; align-items: center; gap: 9px;
      min-height: 42px; padding: 0 17px; border: 1px solid #292721;
      border-radius: 999px; background: #292721; color: #f5f0e5;
      box-shadow: 0 7px 22px rgba(41, 39, 33, .18);
      font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer; transition: background 150ms ease, transform 150ms ease;
    }
    button:hover { background: #d75c3f; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:focus-visible { outline: 3px solid rgba(215, 92, 63, .35); outline-offset: 3px; }
    button[aria-busy="true"] { opacity: .72; pointer-events: none; }
    svg { width: 20px; height: 20px; color: #e77a5b; }
    button:hover svg { color: #f5f0e5; }
    @media (max-width: 620px) { :host { right: 14px; bottom: 14px; } button span { display: none; } button { width: 44px; padding: 0; justify-content: center; } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `Analyze ${info.owner}/${info.repo} with RepoMind`);
  button.innerHTML = `${brandMark()}<span>Analyze with RepoMind</span>`;
  button.addEventListener("click", () => {
    button.setAttribute("aria-busy", "true");
    const label = button.querySelector("span");
    if (label) label.textContent = "Opening RepoMind";

    chrome.runtime.sendMessage(
      { type: "OPEN_SIDE_PANEL", payload: null } satisfies Message<null>,
      (response) => {
        const runtimeError = chrome.runtime.lastError?.message;
        const error = runtimeError || response?.error;

        if (error) {
          console.error("[RepoMind]", error);
          button.title = error;
          if (label) label.textContent = "Could not open · Try again";
        } else {
          button.removeAttribute("title");
          if (label) label.textContent = "RepoMind opened";
        }

        window.setTimeout(() => {
          button.removeAttribute("aria-busy");
          if (label) label.textContent = "Analyze with RepoMind";
        }, error ? 2_400 : 700);
      }
    );
  });

  shadow.append(style, button);
  document.body.append(host);
}

function injectAnalysisBadge(result: {
  contributionScore?: number;
  techStack?: string[];
}): void {
  document.getElementById(BADGE_ID)?.remove();
  if (result.contributionScore === undefined && !result.techStack?.length) return;

  const target = document.querySelector<HTMLElement>(
    '.pagehead-actions, [data-testid="repo-header"], .file-navigation'
  );
  if (!target) return;

  const host = document.createElement("span");
  host.id = BADGE_ID;
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { display: inline-flex; margin-left: 8px; vertical-align: middle; }
    span { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border: 1px solid #292721; background: #f5f0e5; color: #292721; border-radius: 999px; font: 600 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    svg { width: 15px; height: 15px; color: #d75c3f; }
  `;
  const badge = document.createElement("span");
  const detail = result.contributionScore !== undefined
    ? `${result.contributionScore}/100 ready`
    : result.techStack?.slice(0, 2).join(" · ");
  badge.innerHTML = `${brandMark()}<b>RepoMind</b> ${detail}`;
  shadow.append(style, badge);
  target.append(host);
}

function updateDetection(): void {
  const info = detectRepository();
  if (!info) {
    if (lastReportedIdentity !== null) {
      chrome.runtime.sendMessage({ type: "CLEAR_REPO", payload: null } satisfies Message<null>);
      lastReportedIdentity = null;
    }
    currentIdentity = null;
    currentInfo = null;
    document.getElementById(CONTROL_ID)?.remove();
    document.getElementById(BADGE_ID)?.remove();
    return;
  }

  const identity = repoIdentityKey(info);
  const needsRefresh = identity !== currentIdentity || !document.getElementById(CONTROL_ID);
  currentIdentity = identity;
  currentInfo = info;
  if (needsRefresh) {
    document.getElementById(BADGE_ID)?.remove();
    injectRepositoryControl(info);
  }

  if (identity !== lastReportedIdentity || needsRefresh) {
    chrome.runtime.sendMessage({ type: "DETECT_REPO", payload: info } satisfies Message<RepoInfo>);
    lastReportedIdentity = identity;
  }
}

function scheduleDetection(): void {
  if (detectTimer !== null) window.clearTimeout(detectTimer);
  detectTimer = window.setTimeout(updateDetection, 120);
}

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === "INJECT_BADGES" && message.payload && currentInfo) {
    injectAnalysisBadge(message.payload as {
      contributionScore?: number;
      techStack?: string[];
    });
  }
});

updateDetection();

document.addEventListener("turbo:load", scheduleDetection);
document.addEventListener("pjax:end", scheduleDetection);
window.addEventListener("popstate", scheduleDetection);
window.addEventListener("pagehide", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_REPO", payload: null } satisfies Message<null>);
});

const observer = new MutationObserver(scheduleDetection);
observer.observe(document.querySelector("head > title") ?? document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});
