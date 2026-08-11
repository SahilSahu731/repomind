import type { JobRow, Plan, RepoRow } from "@/lib/supabaseDb";

export interface AccountOverviewUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername: string | null;
  plan: Plan;
  creditsRemaining: number;
}

export interface AccountRepository extends RepoRow {
  latestJob: JobRow | null;
}

export interface AccountActivityItem {
  id: string;
  repoId: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoRow["status"];
  progress: number;
  currentStep: string | null;
  occurredAt: string;
}

export interface AccountOverview {
  user: AccountOverviewUser;
  summary: {
    totalRepositories: number;
    reportsReady: number;
    inProgress: number;
    needsAttention: number;
    totalFiles: number;
    totalLines: number;
    uniqueOwners: number;
    activeDays: number;
    completionRate: number;
    topLanguage: string | null;
  };
  languages: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  repositories: AccountRepository[];
  activity: AccountActivityItem[];
  generatedAt: string;
}

export interface AccountOverviewResponse {
  success: true;
  data: AccountOverview;
}

export interface AccountOverviewErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
