import type {
  ArchitectureAnalysis,
  DependencyGraph,
  EntryPoint,
  FileNode,
  TechStack,
} from "@/types";

interface AnalyzeInput {
  fileTree: FileNode;
  flatFiles: FileNode[];
  depGraph: DependencyGraph;
  techStack: TechStack;
  entryPoints: EntryPoint[];
  readme?: string;
  packageJson?: string;
  owner: string;
  repo: string;
}

interface AnalyzeOutput {
  summary: string;
  architecture: ArchitectureAnalysis;
  startGuide: string;
  fileSummaries: Record<string, string>;
}

export async function analyzeWithAI(input: AnalyzeInput): Promise<AnalyzeOutput> {
  const topEntries = input.entryPoints.slice(0, 5);
  const topFiles = input.flatFiles.slice(0, 20);

  const summary =
    `Repository ${input.owner}/${input.repo} contains ${input.flatFiles.length} files and ` +
    `${input.depGraph.edges.length} internal dependencies. Detected frameworks: ` +
    `${input.techStack.frameworks.join(", ") || "unknown"}.`;

  const architecture: ArchitectureAnalysis = {
    pattern: "Modular Monolith",
    modules: [
      {
        name: "App",
        path: "src/app",
        responsibility: "Routes, pages, and API handlers",
        keyFiles: topFiles.slice(0, 3).map((f) => f.path),
      },
    ],
    dataFlow:
      "User submits a repo URL, worker processes repository snapshots, and API serves stored analysis results.",
    layers: ["Presentation", "Application", "Data"],
    issues: [],
  };

  const startGuide = [
    "# RepoMind Onboarding",
    "",
    "## What This Project Does",
    "RepoMind analyzes source repositories and generates architecture and onboarding insights.",
    "",
    "## Where to Start",
    ...topEntries.map((e) => `- ${e.path} (score: ${e.score})`),
  ].join("\n");

  const fileSummaries: Record<string, string> = {};
  for (const file of topFiles) {
    fileSummaries[file.path] = `${file.language ?? "Unknown"} file with ${file.lines} lines.`;
  }

  return {
    summary,
    architecture,
    startGuide,
    fileSummaries,
  };
}
