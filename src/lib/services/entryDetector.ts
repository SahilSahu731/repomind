import type { DependencyGraph, EntryPoint, FileNode } from "@/types";

export async function detectEntryPoints(
  flatFiles: FileNode[],
  depGraph: DependencyGraph
): Promise<EntryPoint[]> {
  const entries: EntryPoint[] = [];

  for (const file of flatFiles) {
    let score = 0;
    const reasons: string[] = [];

    if (/^(index|main|app|server|cli)\.(ts|tsx|js|jsx|py|go|rs)$/.test(file.name)) {
      score += 8;
      reasons.push("Root-level conventional entry filename");
    }

    if (/^(server|api|routes|router|handler)\.(ts|js|py)$/.test(file.name)) {
      score += 4;
      reasons.push("Likely server routing file");
    }

    const node = depGraph.nodes.find((n) => n.path === file.path);
    if (node && node.inDegree > 0) {
      score += Math.min(5, node.inDegree);
      reasons.push("Imported by multiple files");
    }

    if (score > 0) {
      entries.push({ path: file.path, score, reasons });
    }
  }

  return entries.sort((a, b) => b.score - a.score).slice(0, 20);
}
