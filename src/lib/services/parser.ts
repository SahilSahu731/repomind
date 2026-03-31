import fs from "node:fs";
import path from "node:path";
import {
  BINARY_EXTENSIONS,
  IGNORE_DIRS,
  IGNORE_FILES,
  MAX_DEPTH,
  MAX_FILES,
  MAX_FILE_SIZE,
} from "@/lib/constants";
import type { FileNode } from "@/types";

export interface ParseResult {
  tree: FileNode;
  flatFiles: FileNode[];
  stats: {
    totalFiles: number;
    totalLines: number;
    primaryLanguage: string;
  };
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".css": "CSS",
  ".scss": "SCSS",
  ".html": "HTML",
  ".md": "Markdown",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
};

export async function walkDirectory(
  startDir: string,
  rootDir: string
): Promise<ParseResult> {
  const files: FileNode[] = [];
  const languageCount = new Map<string, number>();

  function makeDirNode(currentPath: string): FileNode {
    return {
      path: path.relative(rootDir, currentPath) || ".",
      name: path.basename(currentPath),
      type: "dir",
      extension: "",
      size: 0,
      lines: 0,
      children: [],
    };
  }

  function readTree(currentPath: string, depth: number): FileNode {
    const dirNode = makeDirNode(currentPath);

    if (depth > MAX_DEPTH) {
      return dirNode;
    }

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORE_FILES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) {
          continue;
        }
        dirNode.children.push(readTree(fullPath, depth + 1));
        continue;
      }

      if (files.length >= MAX_FILES) {
        break;
      }

      const ext = path.extname(entry.name);
      if (BINARY_EXTENSIONS.has(ext)) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_FILE_SIZE) {
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n").length;
      const language = LANGUAGE_BY_EXT[ext] ?? "Other";
      languageCount.set(language, (languageCount.get(language) ?? 0) + 1);

      const fileNode: FileNode = {
        path: path.relative(rootDir, fullPath),
        name: entry.name,
        type: "file",
        extension: ext,
        size: stat.size,
        lines,
        language,
        children: [],
      };

      files.push(fileNode);
      dirNode.children.push(fileNode);
    }

    return dirNode;
  }

  const tree = readTree(startDir, 0);

  const primaryLanguage = [...languageCount.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] ?? "Unknown";

  return {
    tree,
    flatFiles: files,
    stats: {
      totalFiles: files.length,
      totalLines: files.reduce((acc, f) => acc + f.lines, 0),
      primaryLanguage,
    },
  };
}
