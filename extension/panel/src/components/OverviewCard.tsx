import {
  Boxes,
  Code2,
  Database,
  ExternalLink,
  Files,
  GitBranch,
  GitFork,
  Network,
  Route,
  ShieldCheck,
  Star,
  TestTube2,
  Wrench,
} from "lucide-react";
import type { AnalysisResult, RepoInfo } from "../../../shared/types";
import { ContributionScore } from "./ContributionScore";

interface Props {
  analysis: AnalysisResult;
  repo: RepoInfo;
}

interface StackGroup {
  label: string;
  items: string[];
  icon: typeof Code2;
}

const eyebrowStyle = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
};

const sectionTitleStyle = {
  fontFamily: "var(--font-serif, Georgia, serif)",
  fontSize: "1.05rem",
  fontWeight: 500,
  letterSpacing: "-0.02em",
};

function canonicalRepoUrl(repo: RepoInfo): string {
  return `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
}

function githubFileUrl(repo: RepoInfo, filePath: string): string {
  const branch = repo.branch || "HEAD";
  const encodedBranch = branch.split("/").map(encodeURIComponent).join("/");
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `${canonicalRepoUrl(repo)}/blob/${encodedBranch}/${encodedPath}`;
}

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function OverviewCard({ analysis, repo }: Props) {
  const summaryParagraphs = analysis.summary
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const stackGroups: StackGroup[] = [
    { label: "Languages", items: uniqueItems(analysis.techStack.languages), icon: Code2 },
    { label: "Frameworks", items: uniqueItems(analysis.techStack.frameworks), icon: Boxes },
    { label: "Databases", items: uniqueItems(analysis.techStack.databases), icon: Database },
    { label: "Testing", items: uniqueItems(analysis.techStack.testing), icon: TestTube2 },
    {
      label: "Tooling",
      items: uniqueItems([...analysis.techStack.tools, ...analysis.techStack.cicd]),
      icon: Wrench,
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-md)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={eyebrowStyle}>Repository brief</p>
            <h2
              style={{
                marginTop: "var(--space-xs)",
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "1.4rem",
                fontWeight: 500,
                letterSpacing: "-0.035em",
                overflowWrap: "anywhere",
              }}
            >
              {repo.owner}/{repo.repo}
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                marginTop: "var(--space-xs)",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
              }}
            >
              <GitBranch size={13} aria-hidden="true" />
              {repo.branch || "default branch"}
            </span>
          </div>

          <a
            href={canonicalRepoUrl(repo)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--sm"
            aria-label={`Open ${repo.owner}/${repo.repo} on GitHub`}
            title="Open on GitHub"
            style={{ padding: 7, flexShrink: 0 }}
          >
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
            gap: "var(--space-xs)",
            marginTop: "var(--space-lg)",
          }}
        >
          {repo.stars !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-sm)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.72rem",
              }}
            >
              <Star size={14} color="var(--warning)" aria-hidden="true" />
              <strong>{repo.stars.toLocaleString()}</strong>
              <span style={{ color: "var(--text-tertiary)" }}>stars</span>
            </div>
          )}
          {repo.forks !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-sm)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.72rem",
              }}
            >
              <GitFork size={14} aria-hidden="true" />
              <strong>{repo.forks.toLocaleString()}</strong>
              <span style={{ color: "var(--text-tertiary)" }}>forks</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-sm)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.72rem",
            }}
          >
            <Files size={14} aria-hidden="true" />
            <strong>{analysis.dependencyGraph.stats.totalNodes}</strong>
            <span style={{ color: "var(--text-tertiary)" }}>files</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-sm)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.72rem",
            }}
          >
            <Network size={14} aria-hidden="true" />
            <strong>{analysis.dependencyGraph.stats.totalEdges}</strong>
            <span style={{ color: "var(--text-tertiary)" }}>links</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "var(--space-sm)",
            marginTop: "var(--space-lg)",
            paddingTop: "var(--space-lg)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {summaryParagraphs.length > 0 ? (
            summaryParagraphs.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={{ fontSize: "0.84rem", lineHeight: 1.75 }}>
                {paragraph}
              </p>
            ))
          ) : (
            <p style={{ fontSize: "0.84rem" }}>No repository summary was generated.</p>
          )}
        </div>
      </section>

      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Code2 size={17} aria-hidden="true" />
          <h3 style={sectionTitleStyle}>Technology signals</h3>
        </div>

        {stackGroups.length > 0 ? (
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            {stackGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                      marginBottom: "var(--space-xs)",
                      color: "var(--text-tertiary)",
                      fontSize: "0.7rem",
                    }}
                  >
                    <Icon size={13} aria-hidden="true" />
                    <span>{group.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                    {group.items.slice(0, 8).map((item) => (
                      <span key={`${group.label}-${item}`} className="pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "0.8rem" }}>No technology signals were detected.</p>
        )}
      </section>

      {analysis.contributionScore && (
        <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              marginBottom: "var(--space-md)",
            }}
          >
            <ShieldCheck size={17} aria-hidden="true" />
            <h3 style={sectionTitleStyle}>Contribution readiness</h3>
          </div>
          <ContributionScore score={analysis.contributionScore} />
        </section>
      )}

      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Route size={17} aria-hidden="true" />
          <h3 style={sectionTitleStyle}>Likely entry points</h3>
        </div>

        {analysis.entryPoints.length > 0 ? (
          <ol style={{ display: "grid", listStyle: "none" }}>
            {analysis.entryPoints.slice(0, 6).map((entryPoint, index) => (
              <li
                key={entryPoint.path}
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  minHeight: 42,
                  padding: "var(--space-sm) 0",
                  borderTop: index === 0 ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ ...eyebrowStyle, color: "var(--accent-primary)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <a
                  href={githubFileUrl(repo, entryPoint.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                  }}
                  title={entryPoint.path}
                >
                  {entryPoint.path}
                </a>
                <span className="pill" style={{ fontSize: "0.64rem" }}>
                  {entryPoint.score}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ fontSize: "0.8rem" }}>No likely entry points were identified.</p>
        )}
      </section>
    </div>
  );
}
