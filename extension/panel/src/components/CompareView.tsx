import { useState } from "react";

interface ComparisonResult {
  summary: string;
  similarities: string[];
  differences: string[];
  recommendation: string;
  scores: {
    repoA: { codeQuality: number; documentation: number; maintainability: number };
    repoB: { codeQuality: number; documentation: number; maintainability: number };
  };
}

interface CompareData {
  repoA: { owner: string; repo: string };
  repoB: { owner: string; repo: string };
  comparison: ComparisonResult;
}

export function CompareView() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    const match = url.match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const handleCompare = async () => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError("Enter a valid GitHub URL (e.g. https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current repo from the store
      const response = await new Promise<CompareData>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: "GET_CACHED_ANALYSIS", payload: null },
          (cached) => {
            if (!cached?.repo) {
              reject(new Error("No current repo detected"));
              return;
            }

            // Call compare via background
            chrome.runtime.sendMessage(
              {
                type: "CHAT_MESSAGE", // Reusing chat channel for simplicity
                payload: {
                  repoId: "__compare__",
                  message: JSON.stringify({
                    repoA: { owner: cached.repo.owner, repo: cached.repo.repo },
                    repoB: parsed,
                  }),
                  history: [],
                },
              },
              (res) => {
                if (res?.ok) resolve(JSON.parse(res.response));
                else reject(new Error(res?.error ?? "Compare failed"));
              }
            );
          }
        );
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreBar = ({ label, value, max = 10 }: { label: string; value: number; max?: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", fontSize: "0.8rem" }}>
      <span style={{ width: 100, color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "var(--bg-tertiary)", borderRadius: "var(--radius-full)" }}>
        <div
          style={{
            width: `${(value / max) * 100}%`,
            height: "100%",
            background: "var(--accent-gradient)",
            borderRadius: "var(--radius-full)",
            transition: "width 0.5s var(--ease-out)",
          }}
        />
      </div>
      <span style={{ width: 24, textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* Input */}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>🔀 Compare with another repo</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "var(--space-md)" }}>
          Enter a GitHub URL to compare with the current repository.
        </p>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            placeholder="https://github.com/owner/repo"
            disabled={isLoading}
            style={{
              flex: 1,
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
          <button
            className="btn btn--primary btn--sm"
            onClick={handleCompare}
            disabled={isLoading || !repoUrl.trim()}
          >
            {isLoading ? "Comparing..." : "Compare"}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginTop: "var(--space-sm)" }}>
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <div className="card animate-slide-up">
            <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-sm)" }}>📊 Comparison Summary</h3>
            <p style={{ fontSize: "0.85rem" }}>{result.comparison.summary}</p>
          </div>

          {/* Scores */}
          <div className="card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>📈 Scores</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", color: "var(--accent-primary)", marginBottom: "var(--space-sm)" }}>
                  {result.repoA.owner}/{result.repoA.repo}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                  <ScoreBar label="Code Quality" value={result.comparison.scores.repoA.codeQuality} />
                  <ScoreBar label="Docs" value={result.comparison.scores.repoA.documentation} />
                  <ScoreBar label="Maintainability" value={result.comparison.scores.repoA.maintainability} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", color: "var(--success)", marginBottom: "var(--space-sm)" }}>
                  {result.repoB.owner}/{result.repoB.repo}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                  <ScoreBar label="Code Quality" value={result.comparison.scores.repoB.codeQuality} />
                  <ScoreBar label="Docs" value={result.comparison.scores.repoB.documentation} />
                  <ScoreBar label="Maintainability" value={result.comparison.scores.repoB.maintainability} />
                </div>
              </div>
            </div>
          </div>

          {/* Similarities */}
          <div className="card animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>🤝 Similarities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              {result.comparison.similarities.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--space-sm)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span>•</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Differences */}
          <div className="card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>⚡ Differences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              {result.comparison.differences.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--space-sm)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span>•</span><span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="card animate-slide-up" style={{ animationDelay: "0.25s", border: "1px solid var(--border-accent)" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-sm)" }}>💡 Recommendation</h3>
            <p style={{ fontSize: "0.85rem" }}>{result.comparison.recommendation}</p>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !isLoading && (
        <div style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--text-tertiary)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-md)" }}>🔀</div>
          <p style={{ fontSize: "0.85rem" }}>
            Enter a repo URL above to see a side-by-side AI comparison
          </p>
        </div>
      )}
    </div>
  );
}
