export interface GitHubAuthProfile {
  id: string | number;
  login?: string;
  avatar_url?: string;
}

export function isGitHubAuthProfile(profile: unknown): profile is GitHubAuthProfile {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  const candidate = profile as Record<string, unknown>;
  return typeof candidate.id === "string" || typeof candidate.id === "number";
}
