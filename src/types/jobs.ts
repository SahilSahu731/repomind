import type { JobStatus, RepoStatus } from "@prisma/client";

export interface AnalyzeJobData {
  repoId: string;
  jobId: string;
  githubUrl: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface JobProgressUpdate {
  status: JobStatus;
  progress: number;
  currentStep: string;
  error?: string;
}

export interface RepoStatusUpdate {
  status: RepoStatus;
  error?: string;
}
