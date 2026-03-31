import type { JobStatus, RepoStatus } from "@prisma/client";

export interface FileNode {
  path: string;
  name: string;
  type: "file" | "dir";
  extension: string;
  size: number;
  lines: number;
  language?: string;
  children: FileNode[];
}

export interface GraphNode {
  id: string;
  path: string;
  name: string;
  extension: string;
  lines: number;
  inDegree: number;
  outDegree: number;
  directory: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "import" | "require" | "dynamic";
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    components: number;
  };
}

export interface EntryPoint {
  path: string;
  score: number;
  reasons: string[];
}

export interface TechStack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cicd: string[];
  testing: string[];
  dependencies: Record<string, string>;
}

export interface ArchitectureAnalysis {
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
}

export interface AnalysisResult {
  id: string;
  repoId: string;
  summary: string;
  architecture: ArchitectureAnalysis;
  fileTree: FileNode;
  dependencyGraph: DependencyGraph;
  entryPoints: EntryPoint[];
  startGuide: string;
  fileSummaries: Record<string, string>;
  techStack: TechStack;
}

export interface RepoWithAnalysis {
  id: string;
  githubUrl: string;
  owner: string;
  name: string;
  branch: string;
  status: RepoStatus;
  defaultLanguage?: string;
  totalFiles: number;
  totalLines: number;
  analyzedAt?: string;
  shareSlug?: string;
  isPublicResult: boolean;
  analysisResult?: AnalysisResult;
}

export interface JobProgress {
  status: JobStatus;
  progress: number;
  currentStep: string;
  repoId: string;
  error?: string;
}
