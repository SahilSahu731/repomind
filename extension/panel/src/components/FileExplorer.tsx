import { useState } from "react";
import type { AnalysisResult } from "../../../shared/types";

interface Props {
  analysis: AnalysisResult;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
  summary?: string;
  lines?: number;
  inDegree?: number;
}

function buildTree(analysis: AnalysisResult): TreeNode {
  const root: TreeNode = { name: "root", path: "", isDir: true, children: [] };
  const dirMap = new Map<string, TreeNode>();
  dirMap.set("", root);

  // Build from dependency graph nodes
  const nodes = [...analysis.dependencyGraph.nodes].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  for (const node of nodes) {
    const parts = node.path.split("/");
    const fileName = parts.pop()!;

    // Ensure parent directories exist
    let currentPath = "";
    let parent = root;
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!dirMap.has(currentPath)) {
        const dir: TreeNode = { name: part, path: currentPath, isDir: true, children: [] };
        parent.children!.push(dir);
        dirMap.set(currentPath, dir);
      }
      parent = dirMap.get(currentPath)!;
    }

    // Add file
    parent.children!.push({
      name: fileName,
      path: node.path,
      isDir: false,
      summary: analysis.fileSummaries[node.path],
      lines: node.lines,
      inDegree: node.inDegree,
    });
  }

  return root;
}

function FileTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.isDir && node.children && node.children.length > 0;

  const icon = node.isDir
    ? isOpen ? "📂" : "📁"
    : node.name.match(/\.(ts|tsx)$/)
      ? "🟦"
      : node.name.match(/\.(js|jsx)$/)
        ? "🟨"
        : node.name.match(/\.(css|scss)$/)
          ? "🎨"
          : node.name.match(/\.(json|yaml|yml)$/)
            ? "📋"
            : "📄";

  return (
    <div>
      <div
        onClick={() => node.isDir && setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          padding: "3px var(--space-sm)",
          paddingLeft: `${depth * 16 + 8}px`,
          cursor: node.isDir ? "pointer" : "default",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.8rem",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: "0.85rem", width: 18, textAlign: "center", flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontFamily: node.isDir ? "var(--font-sans)" : "var(--font-mono)", fontWeight: node.isDir ? 500 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
        {!node.isDir && node.lines !== undefined && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", flexShrink: 0 }}>
            {node.lines}L
          </span>
        )}
        {!node.isDir && node.inDegree !== undefined && node.inDegree > 0 && (
          <span className="pill" style={{ fontSize: "0.65rem", padding: "1px 5px", flexShrink: 0 }}>
            {node.inDegree}↓
          </span>
        )}
      </div>

      {/* File summary */}
      {!node.isDir && node.summary && (
        <div
          style={{
            paddingLeft: `${depth * 16 + 34}px`,
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
            lineHeight: 1.5,
            paddingBottom: "var(--space-xs)",
          }}
        >
          {node.summary}
        </div>
      )}

      {/* Children */}
      {hasChildren && isOpen && (
        <div>
          {node.children!
            .sort((a, b) => {
              if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ analysis }: Props) {
  const [search, setSearch] = useState("");
  const tree = buildTree(analysis);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search files..."
        style={{
          padding: "var(--space-sm) var(--space-md)",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.85rem",
          outline: "none",
        }}
      />

      {/* Stats */}
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <span className="pill">{analysis.dependencyGraph.stats.totalNodes} files</span>
        <span className="pill">{Object.keys(analysis.fileSummaries).length} summarized</span>
      </div>

      {/* Tree */}
      <div
        className="card"
        style={{ padding: "var(--space-sm)", maxHeight: "calc(100vh - 280px)", overflow: "auto" }}
      >
        {tree.children && tree.children.length > 0 ? (
          tree.children
            .sort((a, b) => {
              if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => <FileTreeNode key={child.path} node={child} />)
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-xl)" }}>
            No files found
          </p>
        )}
      </div>
    </div>
  );
}
