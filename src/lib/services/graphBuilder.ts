import fs from "node:fs";
import path from "node:path";
import type { DependencyGraph, FileNode, GraphEdge, GraphNode } from "@/types";

const JS_IMPORT_PATTERNS = [
  /import\s+.*?\s+from\s+["'](.+?)["']/g,
  /import\s*\(\s*["'](.+?)["']\s*\)/g,
  /require\s*\(\s*["'](.+?)["']\s*\)/g,
  /export\s+.*?\s+from\s+["'](.+?)["']/g,
];

export async function buildDependencyGraph(
  flatFiles: FileNode[],
  rootDir: string
): Promise<DependencyGraph> {
  const nodes: GraphNode[] = flatFiles.map((f) => ({
    id: f.path,
    path: f.path,
    name: f.name,
    extension: f.extension,
    lines: f.lines,
    inDegree: 0,
    outDegree: 0,
    directory: f.path.split("/")[0] ?? "root",
  }));

  const nodeSet = new Set(nodes.map((n) => n.path));
  const edges: GraphEdge[] = [];

  for (const file of flatFiles) {
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(file.extension)) {
      continue;
    }

    const content = fs.readFileSync(path.join(rootDir, file.path), "utf8");

    for (const pattern of JS_IMPORT_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        const raw = match[1];
        const resolved = resolveImportPath(raw, file.path, rootDir, nodeSet);
        if (resolved) {
          edges.push({ source: file.path, target: resolved, type: "import" });
        }
      }
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.path, n]));
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source) {
      source.outDegree += 1;
    }
    if (target) {
      target.inDegree += 1;
    }
  }

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgDegree: nodes.length ? (edges.length * 2) / nodes.length : 0,
      components: 1,
    },
  };
}

function resolveImportPath(
  raw: string,
  currentFile: string,
  rootDir: string,
  nodeSet: Set<string>
): string | null {
  if (!raw.startsWith(".") && !raw.startsWith("@/") && !raw.startsWith("~/")) {
    return null;
  }

  let candidate = raw;
  if (raw.startsWith("@/")) {
    candidate = raw.replace("@/", "src/");
  }

  const currentDir = path.dirname(path.join(rootDir, currentFile));
  const absolutePath = path.resolve(currentDir, candidate);

  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ""];
  for (const ext of extensions) {
    const rel = path.relative(rootDir, `${absolutePath}${ext}`);
    if (nodeSet.has(rel)) {
      return rel;
    }
  }

  for (const ext of ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"]) {
    const rel = path.relative(rootDir, `${absolutePath}${ext}`);
    if (nodeSet.has(rel)) {
      return rel;
    }
  }

  return null;
}
