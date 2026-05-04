/* ─── Message Types ─── */

export type MessageType =
  | "DETECT_REPO"
  | "REPO_DETECTED"
  | "START_ANALYSIS"
  | "ANALYSIS_PROGRESS"
  | "ANALYSIS_COMPLETE"
  | "ANALYSIS_ERROR"
  | "CHAT_MESSAGE"
  | "CHAT_RESPONSE"
  | "INJECT_BADGES"
  | "AUTH_STATUS"
  | "GET_AUTH"
  | "LOGIN"
  | "LOGOUT"
  | "GET_CACHED_ANALYSIS"
  | "OPEN_SIDE_PANEL";

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  url: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  topics?: string[];
}

export interface AnalysisProgress {
  jobId: string;
  repoId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "TIMEOUT";
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}

export interface ContributionScoreBreakdown {
  total: number;
  hasContributing: boolean;
  hasSetupInstructions: boolean;
  hasCiCd: boolean;
  hasGoodFirstIssues: boolean;
  readmeQuality: number;
  prResponseTime: number;
  hasCodeOfConduct: boolean;
  hasLicense: boolean;
}

export interface AnalysisResult {
  repoId: string;
  summary: string;
  architecture: {
    pattern: string;
    modules: Array<{
      name: string;
      path: string;
      responsibility: string;
      keyFiles: string[];
    }>;
    dataFlow: string;
    layers: string[];
    issues: string[];
  };
  techStack: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cicd: string[];
    testing: string[];
  };
  dependencyGraph: {
    nodes: Array<{
      id: string;
      path: string;
      name: string;
      extension: string;
      lines: number;
      inDegree: number;
      outDegree: number;
      directory: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
    }>;
    stats: {
      totalNodes: number;
      totalEdges: number;
      avgDegree: number;
      components: number;
    };
  };
  entryPoints: Array<{
    path: string;
    score: number;
    reasons: string[];
  }>;
  startGuide: string;
  fileSummaries: Record<string, string>;
  contributionScore?: ContributionScoreBreakdown;
  fileTree: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  references?: string[];
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  image: string;
  plan: "FREE" | "PRO";
  creditsRemaining: number;
  githubUsername: string;
}

/* ─── Message Payloads ─── */

export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
}

export interface DetectRepoMessage extends Message<RepoInfo> {
  type: "DETECT_REPO";
}

export interface StartAnalysisMessage extends Message<RepoInfo> {
  type: "START_ANALYSIS";
}

export interface AnalysisProgressMessage extends Message<AnalysisProgress> {
  type: "ANALYSIS_PROGRESS";
}

export interface AnalysisCompleteMessage extends Message<AnalysisResult> {
  type: "ANALYSIS_COMPLETE";
}

export interface ChatSendMessage extends Message<{ repoId: string; message: string; history: ChatMessage[] }> {
  type: "CHAT_MESSAGE";
}

export interface ChatResponseMessage extends Message<{ chunk: string; done: boolean }> {
  type: "CHAT_RESPONSE";
}

export interface AuthStatusMessage extends Message<{ isLoggedIn: boolean; user?: UserInfo }> {
  type: "AUTH_STATUS";
}

/* ─── Constants ─── */

export const API_BASE_URL = "https://repomind.vercel.app";
// Use this for local development:
// export const API_BASE_URL = "http://localhost:3000";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const ANALYSIS_STEPS: Record<string, { label: string; icon: string }> = {
  queued: { label: "Queued", icon: "⏳" },
  cloning: { label: "Cloning repository...", icon: "📦" },
  parsing: { label: "Parsing file structure...", icon: "🔍" },
  detecting_stack: { label: "Detecting tech stack...", icon: "🛠️" },
  building_graph: { label: "Building dependency graph...", icon: "🕸️" },
  detecting_entries: { label: "Finding entry points...", icon: "🚪" },
  ai_analysis: { label: "AI is analyzing...", icon: "🧠" },
  storing_results: { label: "Saving results...", icon: "💾" },
  complete: { label: "Analysis complete!", icon: "✅" },
  failed: { label: "Analysis failed", icon: "❌" },
};
