import type { AnalysisResult, RepoInfo } from "../../../shared/types";
import { ContributionScore } from "./ContributionScore";

interface Props {
  analysis: AnalysisResult;
  repo: RepoInfo;
}

export function OverviewCard({ analysis, repo }: Props) {
  const techItems = [
    ...analysis.techStack.languages.map((t) => ({ label: t, category: "lang" })),
    ...analysis.techStack.frameworks.map((t) => ({ label: t, category: "framework" })),
    ...analysis.techStack.tools.slice(0, 5).map((t) => ({ label: t, category: "tool" })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* Hero */}
      <div className="card animate-slide-up">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
          <span style={{ fontSize: "1.4rem" }}>📦</span>
          <div>
            <h2 style={{ fontSize: "1rem" }}>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-primary)" }}
              >
                {repo.owner}/{repo.repo}
              </a>
            </h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Branch: {repo.branch}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
          {repo.stars !== undefined && (
            <div className="pill">⭐ {repo.stars.toLocaleString()} stars</div>
          )}
          {repo.forks !== undefined && (
            <div className="pill">🍴 {repo.forks.toLocaleString()} forks</div>
          )}
          <div className="pill">
            📄 {analysis.dependencyGraph.stats.totalNodes} files
          </div>
          <div className="pill">
            🔗 {analysis.dependencyGraph.stats.totalEdges} deps
          </div>
        </div>

        {/* Summary */}
        <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
          {analysis.summary.split("\n").slice(0, 4).map((line, i) => (
            <p key={i} style={{ marginBottom: "var(--space-sm)" }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>🛠️ Tech Stack</h3>
        <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
          {techItems.map((item) => (
            <span
              key={item.label}
              className={`pill ${item.category === "framework" ? "pill--accent" : ""}`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Contribution Score */}
      {analysis.contributionScore && (
        <div className="card animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>
            🎯 Contribution Readiness
          </h3>
          <ContributionScore score={analysis.contributionScore} />
        </div>
      )}

      {/* Entry Points */}
      <div className="card animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>🚪 Key Entry Points</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {analysis.entryPoints.slice(0, 5).map((ep) => (
            <div
              key={ep.path}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8rem",
              }}
            >
              <a
                href={`${repo.url}/blob/${repo.branch}/${ep.path}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
              >
                {ep.path}
              </a>
              <span className="pill pill--accent" style={{ fontSize: "0.7rem" }}>
                Score: {ep.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
