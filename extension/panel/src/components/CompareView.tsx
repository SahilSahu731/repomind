import { useState } from "react";
import {
  ArrowRight,
  Check,
  GitCompareArrows,
  LoaderCircle,
  Minus,
  Scale,
} from "lucide-react";

interface RepoReference {
  owner: string;
  repo: string;
}

interface ComparisonScores {
  codeQuality: number;
  documentation: number;
  maintainability: number;
}

interface ComparisonResult {
  summary: string;
  similarities: string[];
  differences: string[];
  recommendation: string;
  scores: {
    repoA: ComparisonScores;
    repoB: ComparisonScores;
  };
}

interface CompareData {
  repoA: RepoReference;
  repoB: RepoReference;
  comparison: ComparisonResult;
}

interface CachedRepoResponse {
  repo?: RepoReference | null;
}

interface CompareMessageResponse {
  ok?: boolean;
  data?: unknown;
  result?: unknown;
  response?: unknown;
  error?: string;
}

const sectionTitleStyle = {
  fontFamily: "var(--font-serif, Georgia, serif)",
  fontSize: "1.05rem",
  fontWeight: 500,
  letterSpacing: "-0.02em",
};

function isRepoReference(value: unknown): value is RepoReference {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RepoReference>;
  return typeof candidate.owner === "string" && typeof candidate.repo === "string";
}

function isScores(value: unknown): value is ComparisonScores {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ComparisonScores>;
  return (
    typeof candidate.codeQuality === "number" &&
    typeof candidate.documentation === "number" &&
    typeof candidate.maintainability === "number"
  );
}

function parseCompareData(value: unknown): CompareData | null {
  let candidate = value;

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }

  if (!candidate || typeof candidate !== "object") return null;

  const data = candidate as Partial<CompareData>;
  const comparison = data.comparison;
  if (!comparison || typeof comparison !== "object") return null;

  const scores = comparison.scores;
  if (!scores || typeof scores !== "object") return null;

  return isRepoReference(data.repoA) &&
    isRepoReference(data.repoB) &&
    typeof comparison.summary === "string" &&
    Array.isArray(comparison.similarities) &&
    comparison.similarities.every((item) => typeof item === "string") &&
    Array.isArray(comparison.differences) &&
    comparison.differences.every((item) => typeof item === "string") &&
    typeof comparison.recommendation === "string" &&
    isScores(scores.repoA) &&
    isScores(scores.repoB)
    ? (data as CompareData)
    : null;
}

function parseRepoUrl(value: string): RepoReference | null {
  const normalized = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname)) {
      return null;
    }

    const [owner, rawRepo] = url.pathname.split("/").filter(Boolean);
    const repo = rawRepo?.replace(/\.git$/i, "");
    const isValidPart = (part: string) => /^[A-Za-z0-9._-]+$/.test(part);

    if (!owner || !repo || !isValidPart(owner) || !isValidPart(repo)) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const boundedValue = Math.max(0, Math.min(10, value));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 24px", alignItems: "center", gap: "var(--space-sm)", fontSize: "0.76rem" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={boundedValue}
        style={{
          height: 5,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${boundedValue * 10}%`,
            height: "100%",
            background: "var(--accent-primary)",
            transition: "width 0.4s var(--ease-out)",
          }}
        />
      </div>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {boundedValue}
      </span>
    </div>
  );
}

export function CompareView() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    const repoB = parseRepoUrl(repoUrl);
    if (!repoB) {
      setError("Enter a public GitHub repository URL, such as https://github.com/owner/repo.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const repoA = await new Promise<RepoReference>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: "GET_CACHED_ANALYSIS", payload: null },
          (cached: CachedRepoResponse | undefined) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (!isRepoReference(cached?.repo)) {
              reject(new Error("No current repository was detected."));
              return;
            }

            resolve(cached.repo);
          }
        );
      });

      if (
        repoA.owner.toLowerCase() === repoB.owner.toLowerCase() &&
        repoA.repo.toLowerCase() === repoB.repo.toLowerCase()
      ) {
        throw new Error("Choose a different repository to compare.");
      }

      const comparison = await new Promise<CompareData>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "COMPARE_REPOS",
            payload: { repoA, repoB },
          },
          (response: CompareMessageResponse | undefined) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            const parsed = parseCompareData(
              response?.data ?? response?.result ?? response?.response
            );

            if (response?.ok && parsed) {
              resolve(parsed);
              return;
            }

            reject(new Error(response?.error ?? "The comparison could not be completed."));
          }
        );
      });

      setResult(comparison);
    } catch (comparisonError) {
      setResult(null);
      setError(
        comparisonError instanceof Error
          ? comparisonError.message
          : "The comparison could not be completed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-sm)",
          }}
        >
          <GitCompareArrows size={18} aria-hidden="true" />
          <h2 style={sectionTitleStyle}>Compare repositories</h2>
        </div>
        <p style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
          Compare the current analysis with another repository already analyzed in your workspace.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleCompare();
          }}
          style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}
        >
          <label htmlFor="compare-repository-url" style={{ position: "absolute", left: -10_000 }}>
            GitHub repository URL
          </label>
          <input
            id="compare-repository-url"
            type="text"
            inputMode="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="github.com/owner/repo"
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "var(--space-sm) var(--space-md)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={isLoading || !repoUrl.trim()}
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />
            ) : (
              <ArrowRight size={15} aria-hidden="true" />
            )}
            <span>{isLoading ? "Comparing" : "Compare"}</span>
          </button>
        </form>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: "var(--space-sm)",
              paddingTop: "var(--space-sm)",
              borderTop: "1px solid var(--border-subtle)",
              color: "var(--danger)",
              fontSize: "0.76rem",
            }}
          >
            {error}
          </p>
        )}
      </section>

      {result ? (
        <>
          <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Comparative reading
            </p>
            <h2 style={{ ...sectionTitleStyle, marginTop: "var(--space-xs)" }}>
              {result.repoA.owner}/{result.repoA.repo} and {result.repoB.owner}/{result.repoB.repo}
            </h2>
            <p style={{ marginTop: "var(--space-md)", fontSize: "0.84rem", lineHeight: 1.7 }}>
              {result.comparison.summary}
            </p>
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
              <Scale size={17} aria-hidden="true" />
              <h3 style={sectionTitleStyle}>Signal comparison</h3>
            </div>
            <div style={{ display: "grid", gap: "var(--space-md)" }}>
              {([
                [result.repoA, result.comparison.scores.repoA],
                [result.repoB, result.comparison.scores.repoB],
              ] as const).map(([repo, scores]) => (
                <article
                  key={`${repo.owner}/${repo.repo}`}
                  style={{
                    padding: "var(--space-md)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-tertiary)",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "var(--space-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {repo.owner}/{repo.repo}
                  </h4>
                  <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                    <ScoreBar label="Code quality" value={scores.codeQuality} />
                    <ScoreBar label="Documentation" value={scores.documentation} />
                    <ScoreBar label="Maintainability" value={scores.maintainability} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "var(--space-md)" }}>Shared ground</h3>
            <ul style={{ display: "grid", gap: "var(--space-sm)", listStyle: "none" }}>
              {result.comparison.similarities.map((similarity, index) => (
                <li
                  key={`${similarity}-${index}`}
                  style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: "var(--space-sm)", color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.6 }}
                >
                  <Check size={15} color="var(--success)" aria-hidden="true" />
                  <span>{similarity}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "var(--space-md)" }}>Meaningful differences</h3>
            <ul style={{ display: "grid", gap: "var(--space-sm)", listStyle: "none" }}>
              {result.comparison.differences.map((difference, index) => (
                <li
                  key={`${difference}-${index}`}
                  style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: "var(--space-sm)", color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.6 }}
                >
                  <Minus size={15} color="var(--accent-primary)" aria-hidden="true" />
                  <span>{difference}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="card"
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--accent-primary)" }}
          >
            <p
              style={{
                color: "var(--accent-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Practical guidance
            </p>
            <p style={{ marginTop: "var(--space-sm)", fontSize: "0.84rem", lineHeight: 1.7 }}>
              {result.comparison.recommendation}
            </p>
          </section>
        </>
      ) : (
        !isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-2xl) var(--space-lg)",
              border: "1px dashed var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <GitCompareArrows size={25} color="var(--text-tertiary)" aria-hidden="true" />
            <p style={{ maxWidth: 260, fontSize: "0.8rem" }}>
              Add a repository URL above to create a side-by-side reading.
            </p>
          </div>
        )
      )}
    </div>
  );
}
