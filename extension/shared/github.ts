import type { RepoInfo } from "./types";

const NON_REPOSITORY_OWNERS = new Set([
  "collections",
  "codespaces",
  "enterprise",
  "events",
  "explore",
  "features",
  "issues",
  "join",
  "login",
  "marketplace",
  "new",
  "notifications",
  "organizations",
  "orgs",
  "pricing",
  "pulls",
  "security",
  "settings",
  "signup",
  "sponsors",
  "topics",
  "trending",
]);

const REPOSITORY_PART_PATTERN = /^[\w.-]+$/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeBranch(value: string | null | undefined): string {
  const branch = value?.trim();
  return branch && branch.length <= 255 ? branch : "HEAD";
}

export function parseGitHubRepositoryUrl(
  input: string,
  detectedBranch?: string | null
): RepoInfo | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean).map(safeDecode);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    if (
      NON_REPOSITORY_OWNERS.has(owner.toLowerCase()) ||
      !REPOSITORY_PART_PATTERN.test(owner) ||
      !REPOSITORY_PART_PATTERN.test(repo)
    ) {
      return null;
    }

    const fallbackBranch = parts[2] === "tree" && parts[3] ? parts[3] : "HEAD";
    const branch = normalizeBranch(detectedBranch ?? fallbackBranch);

    return {
      owner,
      repo,
      branch,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

export function repoIdentityKey(repo: RepoInfo): string {
  return `${repo.owner.toLowerCase()}/${repo.repo.toLowerCase()}@${repo.branch}`;
}
