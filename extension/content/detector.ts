/**
 * RepoMind Content Script — Detector
 *
 * Runs on every github.com page. Detects if the user is viewing a repository
 * and extracts metadata from the DOM. Injects a floating "Scan" button.
 */

import type { RepoInfo, Message } from "../shared/types";

/* ─── Repo Detection ─── */

const REPO_URL_REGEX = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?(.*)$/;

function parseGitHubUrl(): RepoInfo | null {
  const match = window.location.href.match(REPO_URL_REGEX);
  if (!match) return null;

  const [, owner, repo, rest] = match;

  // Skip non-repo pages (settings, orgs, etc.)
  const skipOwners = new Set([
    "settings",
    "notifications",
    "explore",
    "topics",
    "trending",
    "collections",
    "events",
    "sponsors",
    "marketplace",
    "pulls",
    "issues",
    "codespaces",
    "features",
    "security",
    "pricing",
    "enterprise",
    "login",
    "signup",
    "join",
    "new",
    "organizations",
    "orgs",
  ]);

  if (skipOwners.has(owner)) return null;

  // Detect branch from /tree/<branch> path
  let branch = "main";
  if (rest) {
    const treePath = rest.match(/^tree\/([^/]+)/);
    if (treePath) {
      branch = treePath[1];
    }
  }

  return { owner, repo, branch, url: window.location.href };
}

function extractDomMetadata(info: RepoInfo): RepoInfo {
  try {
    // Description
    const descEl = document.querySelector<HTMLElement>(
      '[data-testid="about-description"], .f4.my-3, p.f4.my-3'
    );
    if (descEl) info.description = descEl.textContent?.trim();

    // Stars
    const starEl = document.querySelector<HTMLElement>(
      '#repo-stars-counter-star, a[href$="/stargazers"] .Counter, a[href$="/stargazers"] span'
    );
    if (starEl) {
      const text = starEl.textContent?.trim().replace(/,/g, "") ?? "0";
      const num = parseFloat(text);
      if (text.endsWith("k")) info.stars = Math.round(num * 1000);
      else info.stars = Math.round(num);
    }

    // Forks
    const forkEl = document.querySelector<HTMLElement>(
      '#repo-network-counter, a[href$="/forks"] .Counter, a[href$="/forks"] span'
    );
    if (forkEl) {
      const text = forkEl.textContent?.trim().replace(/,/g, "") ?? "0";
      const num = parseFloat(text);
      if (text.endsWith("k")) info.forks = Math.round(num * 1000);
      else info.forks = Math.round(num);
    }

    // Primary language
    const langEl = document.querySelector<HTMLElement>(
      '.BorderGrid-cell [itemprop="programmingLanguage"], .repository-lang-stats-graph .language-color + span'
    );
    if (langEl) info.language = langEl.textContent?.trim();

    // Topics
    const topicEls = document.querySelectorAll<HTMLAnchorElement>(
      'a.topic-tag, a[data-octo-click="topic_click"]'
    );
    if (topicEls.length > 0) {
      info.topics = Array.from(topicEls).map(
        (el) => el.textContent?.trim() ?? ""
      ).filter(Boolean);
    }
  } catch {
    // DOM scraping is best-effort
  }

  return info;
}

/* ─── Floating Scan Button ─── */

const BUTTON_ID = "repomind-scan-button";

function injectScanButton(info: RepoInfo): void {
  // Don't re-inject
  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement("div");
  button.id = BUTTON_ID;
  button.innerHTML = `
    <button id="repomind-scan-btn" aria-label="Scan with RepoMind">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <span>Scan Repo</span>
    </button>
  `;

  // Attach shadow DOM for style isolation
  const shadow = button.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    button:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0,0,0,0.15);
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }

    button:active {
      transform: translateY(0) scale(0.98);
    }

    button svg {
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 4px 32px rgba(99, 102, 241, 0.6); }
    }

    button.scanning {
      animation: pulse 2s ease-in-out infinite;
      pointer-events: none;
      opacity: 0.8;
    }

    button.scanning span::after {
      content: '...';
      animation: dots 1.5s steps(3) infinite;
    }

    @keyframes dots {
      0% { content: ''; }
      33% { content: '.'; }
      66% { content: '..'; }
      100% { content: '...'; }
    }
  `;

  const btn = document.createElement("button");
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <span>Scan Repo</span>
  `;

  btn.addEventListener("click", () => {
    btn.classList.add("scanning");
    btn.querySelector("span")!.textContent = "Scanning";

    // Tell background to open side panel and start analysis
    chrome.runtime.sendMessage({
      type: "START_ANALYSIS",
      payload: info,
    } satisfies Message<RepoInfo>);

    // Reset button after a delay
    setTimeout(() => {
      btn.classList.remove("scanning");
      btn.querySelector("span")!.textContent = "Scan Repo";
    }, 5000);
  });

  shadow.appendChild(style);
  shadow.appendChild(btn);
  document.body.appendChild(button);
}

function removeScanButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

/* ─── Badge Injection ─── */

function injectRepoBadges(result: { contributionScore?: number; techStack?: string[] }): void {
  try {
    // Find the repo header area
    const headerActions = document.querySelector<HTMLElement>(
      ".pagehead-actions, .file-navigation, [data-testid='repo-header']"
    );
    if (!headerActions) return;

    // Don't re-inject
    if (document.getElementById("repomind-badges")) return;

    const badgeContainer = document.createElement("div");
    badgeContainer.id = "repomind-badges";
    const shadow = badgeContainer.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 8px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .score-badge {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }
    `;

    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px";

    if (result.contributionScore !== undefined) {
      const badge = document.createElement("span");
      badge.className = "badge score-badge";
      badge.textContent = `🧠 RepoMind: ${result.contributionScore}/100`;
      wrapper.appendChild(badge);
    }

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    headerActions.appendChild(badgeContainer);
  } catch {
    // Best effort
  }
}

/* ─── Main Loop ─── */

let currentRepo: string | null = null;

function detectAndNotify(): void {
  const info = parseGitHubUrl();

  if (!info) {
    removeScanButton();
    currentRepo = null;
    return;
  }

  const repoKey = `${info.owner}/${info.repo}`;

  // Only act if the repo changed
  if (repoKey === currentRepo) return;
  currentRepo = repoKey;

  // Extract DOM metadata
  const enriched = extractDomMetadata(info);

  // Inject scan button
  injectScanButton(enriched);

  // Notify background worker
  chrome.runtime.sendMessage({
    type: "DETECT_REPO",
    payload: enriched,
  } satisfies Message<RepoInfo>);
}

// Listen for badge injection commands from background
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === "INJECT_BADGES" && message.payload) {
    injectRepoBadges(message.payload as { contributionScore?: number; techStack?: string[] });
  }
});

// Run on load
detectAndNotify();

// Re-detect on GitHub's SPA navigation (they use turbo/pjax)
const observer = new MutationObserver(() => {
  detectAndNotify();
});

observer.observe(document.querySelector("head > title") ?? document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});

// Also listen for popstate (back/forward navigation)
window.addEventListener("popstate", () => {
  setTimeout(detectAndNotify, 100);
});
