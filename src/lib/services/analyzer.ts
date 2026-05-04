import type {
  ArchitectureAnalysis,
  DependencyGraph,
  EntryPoint,
  FileNode,
  TechStack,
} from "@/types";
import { generateWithGemini, hasGeminiKey } from "@/lib/ai";

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

interface GeminiModule {
  name: string;
  path: string;
  responsibility: string;
  keyFiles: string[];
}

interface GeminiArchitecture {
  pattern: string;
  modules: GeminiModule[];
  dataFlow: string;
  layers: string[];
  issues: string[];
}

interface GeminiFileInsight {
  path: string;
  summary: string;
}

interface GeminiAnalysis {
  summary: string;
  architecture: GeminiArchitecture;
  setupGuide: string[];
  keyFindings: string[];
  risks: string[];
  fileInsights: GeminiFileInsight[];
}

export async function analyzeWithAI(input: AnalyzeInput): Promise<AnalyzeOutput> {
  const fallback = createFallbackAnalysis(input);

  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    const prompt = buildGeminiPrompt(input);
    const raw = await generateWithGemini({
      prompt,
      responseMimeType: "application/json",
    });
    const parsed = parseGeminiPayload(raw);

    if (!parsed) {
      return fallback;
    }

    return {
      summary: composeSummary(parsed, input),
      architecture: coerceArchitecture(parsed.architecture, fallback.architecture),
      startGuide: composeStartGuide(parsed, input),
      fileSummaries: coerceFileSummaries(parsed.fileInsights, input.flatFiles, fallback.fileSummaries),
    };
  } catch {
    return fallback;
  }
}

function buildGeminiPrompt(input: AnalyzeInput): string {
  const topFilesByLines = [...input.flatFiles]
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 80)
    .map((file) => ({
      path: file.path,
      language: file.language ?? "Other",
      lines: file.lines,
    }));

  const highestDegreeNodes = [...input.depGraph.nodes]
    .sort((a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree))
    .slice(0, 60)
    .map((node) => ({
      path: node.path,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
      lines: node.lines,
    }));

  const snapshot = {
    repo: `${input.owner}/${input.repo}`,
    totalFiles: input.flatFiles.length,
    totalDependencies: input.depGraph.edges.length,
    techStack: input.techStack,
    entryPoints: input.entryPoints.slice(0, 20),
    topFilesByLines,
    highestDegreeNodes,
    representativePaths: input.flatFiles.slice(0, 300).map((file) => file.path),
    readme: trimText(input.readme, 6000),
    packageJson: trimText(input.packageJson, 6000),
  };

  return [
    "You are a senior software architect and developer onboarding lead.",
    "Analyze this GitHub repository snapshot and produce a complete, practical report.",
    "Respond ONLY as valid JSON (no markdown, no code fences).",
    "",
    "Return this exact JSON shape:",
    JSON.stringify(
      {
        summary: "2-4 dense paragraphs covering purpose, architecture style, strengths, weaknesses",
        architecture: {
          pattern: "string",
          modules: [{ name: "string", path: "string", responsibility: "string", keyFiles: ["string"] }],
          dataFlow: "string",
          layers: ["string"],
          issues: ["string"],
        },
        setupGuide: ["ordered onboarding steps and command suggestions"],
        keyFindings: ["critical insights developers should know"],
        risks: ["quality, scalability, maintainability or security risks"],
        fileInsights: [{ path: "relative/path", summary: "why this file matters" }],
      },
      null,
      2
    ),
    "",
    "Repository snapshot:",
    JSON.stringify(snapshot),
  ].join("\n");
}

function trimText(value: string | undefined, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...truncated...`;
}

function parseGeminiPayload(raw: string): GeminiAnalysis | null {
  const candidate = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(candidate) as Partial<GeminiAnalysis>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (typeof parsed.summary !== "string" || !parsed.architecture) {
      return null;
    }

    return {
      summary: parsed.summary,
      architecture: parsed.architecture as GeminiArchitecture,
      setupGuide: Array.isArray(parsed.setupGuide)
        ? parsed.setupGuide.filter((item): item is string => typeof item === "string")
        : [],
      keyFindings: Array.isArray(parsed.keyFindings)
        ? parsed.keyFindings.filter((item): item is string => typeof item === "string")
        : [],
      risks: Array.isArray(parsed.risks)
        ? parsed.risks.filter((item): item is string => typeof item === "string")
        : [],
      fileInsights: Array.isArray(parsed.fileInsights)
        ? parsed.fileInsights
            .filter(
              (item): item is GeminiFileInsight =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.path === "string" &&
                typeof item.summary === "string"
            )
            .slice(0, 30)
        : [],
    };
  } catch {
    return null;
  }
}

function coerceArchitecture(
  architecture: GeminiArchitecture,
  fallback: ArchitectureAnalysis
): ArchitectureAnalysis {
  const modules = Array.isArray(architecture.modules)
    ? architecture.modules
        .filter((module) => module && typeof module.name === "string")
        .slice(0, 12)
        .map((module) => ({
          name: module.name,
          path: module.path || "(unspecified)",
          responsibility: module.responsibility || "No responsibility provided",
          keyFiles: Array.isArray(module.keyFiles)
            ? module.keyFiles.filter((file): file is string => typeof file === "string").slice(0, 8)
            : [],
        }))
    : [];

  return {
    pattern:
      typeof architecture.pattern === "string" && architecture.pattern.trim().length > 0
        ? architecture.pattern
        : fallback.pattern,
    modules: modules.length > 0 ? modules : fallback.modules,
    dataFlow:
      typeof architecture.dataFlow === "string" && architecture.dataFlow.trim().length > 0
        ? architecture.dataFlow
        : fallback.dataFlow,
    layers: Array.isArray(architecture.layers)
      ? architecture.layers.filter((item): item is string => typeof item === "string").slice(0, 12)
      : fallback.layers,
    issues: Array.isArray(architecture.issues)
      ? architecture.issues.filter((item): item is string => typeof item === "string").slice(0, 18)
      : fallback.issues,
  };
}

function composeSummary(parsed: GeminiAnalysis, input: AnalyzeInput): string {
  const lines = [
    parsed.summary.trim(),
    "",
    "### Key Findings",
    ...parsed.keyFindings.slice(0, 10).map((finding) => `- ${finding}`),
    "",
    "### Risks",
    ...parsed.risks.slice(0, 10).map((risk) => `- ${risk}`),
    "",
    `Snapshot stats: ${input.flatFiles.length} files, ${input.depGraph.edges.length} internal dependency edges, ${input.entryPoints.length} entry points.`,
  ];

  return lines.join("\n").trim();
}

function composeStartGuide(parsed: GeminiAnalysis, input: AnalyzeInput): string {
  const topEntries = input.entryPoints.slice(0, 6);

  return [
    `# Start Guide for ${input.owner}/${input.repo}`,
    "",
    "## Suggested Onboarding Steps",
    ...(parsed.setupGuide.length > 0
      ? parsed.setupGuide.slice(0, 12).map((step, index) => `${index + 1}. ${step}`)
      : ["1. Install dependencies from package manager lockfiles.", "2. Run lint/test/build commands."]),
    "",
    "## High-Value Entry Points",
    ...topEntries.map((entry) => `- ${entry.path} (score ${entry.score})`),
  ].join("\n");
}

function coerceFileSummaries(
  fileInsights: GeminiFileInsight[],
  flatFiles: FileNode[],
  fallback: Record<string, string>
): Record<string, string> {
  const available = new Set(flatFiles.map((file) => file.path));
  const summaries: Record<string, string> = {};

  for (const item of fileInsights) {
    if (!available.has(item.path)) {
      continue;
    }

    summaries[item.path] = item.summary.trim();
  }

  if (Object.keys(summaries).length === 0) {
    return fallback;
  }

  return summaries;
}

function createFallbackAnalysis(input: AnalyzeInput): AnalyzeOutput {
  const topEntries = input.entryPoints.slice(0, 5);
  const topFiles = input.flatFiles.slice(0, 20);
  const dominantFrameworks =
    input.techStack.frameworks.length > 0 ? input.techStack.frameworks.join(", ") : "Not clearly detected";

  const summary = [
    `Repository ${input.owner}/${input.repo} contains ${input.flatFiles.length} files and ${input.depGraph.edges.length} internal dependency edges.`,
    `Primary frameworks: ${dominantFrameworks}. Primary languages: ${input.techStack.languages.slice(0, 5).join(", ") || "Unknown"}.`,
    "",
    "### Key Findings",
    `- ${input.entryPoints.length} likely entry points were detected for onboarding.`,
    `- Dependency graph includes ${input.depGraph.stats.totalNodes} nodes and ${input.depGraph.stats.totalEdges} edges.`,
  ].join("\n");

  const architecture: ArchitectureAnalysis = {
    pattern: "Modular Monolith",
    modules: [
      {
        name: "Application Surface",
        path: "src/app",
        responsibility: "Contains the UI routes, API handlers, and top-level app flow",
        keyFiles: topFiles.slice(0, 4).map((file) => file.path),
      },
    ],
    dataFlow:
      "Repository ingestion triggers parsing, dependency graphing, and AI synthesis before serving persisted analysis to the user dashboard.",
    layers: ["UI", "Domain Services", "Storage"],
    issues: [],
  };

  const startGuide = [
    `# Start Guide for ${input.owner}/${input.repo}`,
    "",
    "## Suggested Onboarding Steps",
    "1. Read the README and package configuration to understand expected runtime.",
    "2. Open top entry points first, then traverse imported modules.",
    "3. Run lint, tests, and build before making architectural changes.",
    "",
    "## High-Value Entry Points",
    ...topEntries.map((entry) => `- ${entry.path} (score ${entry.score})`),
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
