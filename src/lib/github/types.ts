export interface GitHubAccount {
  id: number;
  login: string;
  type: "User" | "Organization" | string;
  avatar_url?: string | null;
}

export interface GitHubInstallation {
  id: number;

  account: GitHubAccount;

  app_id: number;
  app_slug: string;

  target_id: number;
  target_type: string;

  repository_selection:
    | "all"
    | "selected";

  permissions: Record<
    string,
    string
  >;

  events: string[];

  suspended_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;

  name: string;
  full_name: string;

  private: boolean;

  html_url: string;

  default_branch: string;

  archived: boolean;

  pushed_at: string | null;

  owner: {
    id: number;
    login: string;
  };
}

export interface GitHubUserInstallationsResponse {
  total_count: number;
  installations: GitHubInstallation[];
}

export interface GitHubInstallationRepositoriesResponse {
  total_count: number;
  repositories: GitHubRepository[];
}

export interface GitHubInstallationAccessTokenResponse {
  token: string;
  expires_at: string;

  permissions: Record<
    string,
    string
  >;

  repository_selection:
    | "all"
    | "selected";
}
