import { useMemo, useState } from "react";
import {
  Braces,
  File,
  FileCode2,
  Files,
  Folder,
  FolderOpen,
  Palette,
  Search,
  X,
} from "lucide-react";
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

interface TreeResult {
  root: TreeNode;
  matchingFiles: number;
}

function buildTree(analysis: AnalysisResult, query: string): TreeResult {
  const root: TreeNode = { name: "root", path: "", isDir: true, children: [] };
  const directoryMap = new Map<string, TreeNode>([["", root]]);
  const normalizedQuery = query.trim().toLowerCase();

  const matchingNodes = [...analysis.dependencyGraph.nodes]
    .filter((node) => {
      if (!normalizedQuery) return true;
      const summary = analysis.fileSummaries[node.path] ?? "";
      return (
        node.path.toLowerCase().includes(normalizedQuery) ||
        summary.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  for (const node of matchingNodes) {
    const pathParts = node.path.split("/").filter(Boolean);
    const fileName = pathParts.pop();
    if (!fileName) continue;

    let currentPath = "";
    let parent = root;

    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let directory = directoryMap.get(currentPath);

      if (!directory) {
        directory = {
          name: part,
          path: currentPath,
          isDir: true,
          children: [],
        };
        parent.children?.push(directory);
        directoryMap.set(currentPath, directory);
      }

      parent = directory;
    }

    parent.children?.push({
      name: fileName,
      path: node.path,
      isDir: false,
      summary: analysis.fileSummaries[node.path],
      lines: node.lines,
      inDegree: node.inDegree,
    });
  }

  return { root, matchingFiles: matchingNodes.length };
}

function sortTreeNodes(left: TreeNode, right: TreeNode): number {
  if (left.isDir !== right.isDir) return left.isDir ? -1 : 1;
  return left.name.localeCompare(right.name);
}

function NodeIcon({ node, isOpen }: { node: TreeNode; isOpen: boolean }) {
  if (node.isDir) {
    return isOpen ? (
      <FolderOpen size={15} color="var(--accent-primary)" aria-hidden="true" />
    ) : (
      <Folder size={15} color="var(--text-tertiary)" aria-hidden="true" />
    );
  }

  if (/\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(node.name)) {
    return <FileCode2 size={15} color="var(--accent-primary)" aria-hidden="true" />;
  }
  if (/\.(css|scss|sass|less)$/i.test(node.name)) {
    return <Palette size={15} color="var(--warning)" aria-hidden="true" />;
  }
  if (/\.(json|yaml|yml|toml)$/i.test(node.name)) {
    return <Braces size={15} color="var(--success)" aria-hidden="true" />;
  }
  return <File size={15} color="var(--text-tertiary)" aria-hidden="true" />;
}

function FileTreeNode({
  node,
  depth = 0,
  revealMatches,
}: {
  node: TreeNode;
  depth?: number;
  revealMatches: boolean;
}) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const hasChildren = Boolean(node.isDir && node.children && node.children.length > 0);
  const isExpanded = hasChildren && (revealMatches || isOpen);

  const rowContent = (
    <>
      <span
        style={{
          width: 18,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <NodeIcon node={node} isOpen={isExpanded} />
      </span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: node.isDir ? "var(--font-sans)" : "var(--font-mono)",
          fontWeight: node.isDir ? 600 : 400,
        }}
        title={node.path}
      >
        {node.name}
      </span>
      {!node.isDir && node.lines !== undefined && (
        <span style={{ color: "var(--text-tertiary)", fontSize: "0.65rem", flexShrink: 0 }}>
          {node.lines} lines
        </span>
      )}
      {!node.isDir && node.inDegree !== undefined && node.inDegree > 0 && (
        <span className="pill" style={{ padding: "1px 5px", fontSize: "0.62rem", flexShrink: 0 }}>
          {node.inDegree} in
        </span>
      )}
    </>
  );

  return (
    <li style={{ listStyle: "none" }}>
      {node.isDir ? (
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isExpanded}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            minHeight: 30,
            padding: "4px var(--space-sm)",
            paddingLeft: `${depth * 14 + 8}px`,
            border: 0,
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.76rem",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          {rowContent}
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            minHeight: 30,
            padding: "4px var(--space-sm)",
            paddingLeft: `${depth * 14 + 8}px`,
            color: "var(--text-primary)",
            fontSize: "0.74rem",
          }}
        >
          {rowContent}
        </div>
      )}

      {!node.isDir && node.summary && (
        <p
          style={{
            margin: "0 var(--space-sm) var(--space-xs)",
            paddingLeft: `${depth * 14 + 26}px`,
            color: "var(--text-tertiary)",
            fontSize: "0.7rem",
            lineHeight: 1.5,
          }}
        >
          {node.summary}
        </p>
      )}

      {isExpanded && node.children && (
        <ul>
          {[...node.children].sort(sortTreeNodes).map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              revealMatches={revealMatches}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileExplorer({ analysis }: Props) {
  const [search, setSearch] = useState("");
  const { root, matchingFiles } = useMemo(
    () => buildTree(analysis, search),
    [analysis, search]
  );
  const revealMatches = search.trim().length > 0;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Files size={17} aria-hidden="true" />
          <div>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.64rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              Repository index
            </p>
            <h2
              style={{
                marginTop: 2,
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "1.05rem",
                fontWeight: 500,
              }}
            >
              Files and summaries
            </h2>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <label htmlFor="file-search" style={{ position: "absolute", left: -10_000 }}>
            Search file paths and summaries
          </label>
          <Search
            size={15}
            color="var(--text-tertiary)"
            aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            id="file-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search paths or summaries"
            autoComplete="off"
            style={{
              width: "100%",
              padding: "var(--space-sm) 34px var(--space-sm) 34px",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear file search"
              title="Clear search"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                display: "inline-flex",
                padding: 3,
                border: 0,
                background: "transparent",
                color: "var(--text-tertiary)",
                cursor: "pointer",
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            flexWrap: "wrap",
            marginTop: "var(--space-sm)",
          }}
        >
          <span className="pill">
            {revealMatches
              ? `${matchingFiles} matching ${matchingFiles === 1 ? "file" : "files"}`
              : `${analysis.dependencyGraph.stats.totalNodes} files`}
          </span>
          <span className="pill">{Object.keys(analysis.fileSummaries).length} summarized</span>
        </div>
      </div>

      <div
        style={{
          maxHeight: "calc(100vh - 285px)",
          overflow: "auto",
          padding: "var(--space-sm)",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-card)",
        }}
      >
        {root.children && root.children.length > 0 ? (
          <ul>
            {[...root.children].sort(sortTreeNodes).map((child) => (
              <FileTreeNode key={child.path} node={child} revealMatches={revealMatches} />
            ))}
          </ul>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-2xl) var(--space-md)",
              color: "var(--text-tertiary)",
              textAlign: "center",
            }}
          >
            <Search size={20} aria-hidden="true" />
            <p style={{ fontSize: "0.78rem" }}>
              {revealMatches ? `No files match “${search.trim()}”.` : "No files were found."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
