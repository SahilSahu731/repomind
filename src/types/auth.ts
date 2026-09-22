export interface GitHubAuthProfile {
  id:
    | string
    | number;

  login: string;

  name?:
    | string
    | null;

  email?:
    | string
    | null;

  avatar_url?:
    | string
    | null;
}

export function isGitHubAuthProfile(
  profile: unknown,
): profile is GitHubAuthProfile {
  if (
    !profile ||
    typeof profile !==
      "object"
  ) {
    return false;
  }

  const candidate =
    profile as
      Record<
        string,
        unknown
      >;

  const hasId =
    typeof candidate.id ===
      "string" ||
    typeof candidate.id ===
      "number";

  return (
    hasId &&
    typeof candidate.login ===
      "string"
  );
}
