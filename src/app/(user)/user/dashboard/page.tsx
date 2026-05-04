"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  AlertTriangle,
  CircleCheckBig,
  Clock3,
  FileCode2,
  GitBranch,
  Layers,
  Link2,
  Loader2,
  Network,
  Rocket,
  Scale,
  Server,
} from "lucide-react";
import type { AnalysisResult } from "@/types";
import type { JobRow, RepoRow } from "@/lib/supabaseDb";

interface RepoDetailsResponse {
  success: true;
  data: {
    repo: RepoRow;
    analysisResult: AnalysisResult | null;
    job: JobRow | null;
  };
}

interface RepoDetailsError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string): string {
  if (status === "COMPLETE" || status === "COMPLETED") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "FAILED" || status === "TIMEOUT") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  }
  return "border-sky-400/30 bg-sky-500/10 text-sky-200";
}

function topConnectedFiles(analysis: AnalysisResult | null) {
  if (!analysis) {
    return [] as Array<{ path: string; score: number; lines: number }>;
  }

  return [...analysis.dependencyGraph.nodes]
    .map((node) => ({
      path: node.path,
      score: node.inDegree + node.outDegree,
      lines: node.lines,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export default function UserDashboardPage() {
  const searchParams = useSearchParams();
  const repoId = searchParams.get("repoId");
  const repoSlug = searchParams.get("repo");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoRow | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [job, setJob] = useState<JobRow | null>(null);

  const loadRepoDetails = useCallback(async () => {
    if (!repoId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/repos/${encodeURIComponent(repoId)}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as RepoDetailsResponse | RepoDetailsError;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Unable to load repository analysis" : payload.error.message;
        setError(message);
        return;
      }

      setRepo(payload.data.repo);
      setAnalysisResult(payload.data.analysisResult);
      setJob(payload.data.job);
    } catch {
      setError("Unable to fetch repository analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    void loadRepoDetails();
  }, [loadRepoDetails]);

  useEffect(() => {
    if (!repoId) {
      return;
    }

    const shouldPoll =
      (repo?.status && repo.status !== "COMPLETE" && repo.status !== "FAILED") || !analysisResult;

    if (!shouldPoll) {
      return;
    }

    const interval = setInterval(() => {
      void loadRepoDetails();
    }, 3500);

    return () => clearInterval(interval);
  }, [analysisResult, loadRepoDetails, repo?.status, repoId]);

  const stackSections = useMemo(() => {
    if (!analysisResult) {
      return [] as Array<{ label: string; values: string[]; icon: React.ReactNode }>;
    }

    return [
      { label: "Languages", values: analysisResult.techStack.languages, icon: <FileCode2 className="h-4 w-4" /> },
      { label: "Frameworks", values: analysisResult.techStack.frameworks, icon: <Layers className="h-4 w-4" /> },
      { label: "Databases", values: analysisResult.techStack.databases, icon: <Server className="h-4 w-4" /> },
      { label: "Testing", values: analysisResult.techStack.testing, icon: <Scale className="h-4 w-4" /> },
      { label: "CI/CD", values: analysisResult.techStack.cicd, icon: <Rocket className="h-4 w-4" /> },
      { label: "Tooling", values: analysisResult.techStack.tools, icon: <Activity className="h-4 w-4" /> },
    ];
  }, [analysisResult]);

  const connectedFiles = useMemo(() => topConnectedFiles(analysisResult), [analysisResult]);

  if (!repoId) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Repository Analysis Dashboard</h2>
        <p className="mt-3 max-w-[70ch] text-sm leading-7 text-muted">
          Enter a GitHub URL on the home page to start analysis. When a run starts, this dashboard will display the complete architecture report, file intelligence, dependency map signals, and onboarding guide.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Live Repository Report</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {repo ? `${repo.owner}/${repo.name}` : (repoSlug ?? "Loading repository")}
            </h2>
            <p className="mt-2 text-sm text-muted">Branch: {repo?.branch ?? "main"}</p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(repo?.status ?? "QUEUED")}`}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
            {formatStatus(repo?.status ?? "QUEUED")}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {job && repo?.status !== "COMPLETE" && repo?.status !== "FAILED" && (
          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted">Current step: <span className="font-semibold text-foreground">{job.currentStep ?? "processing"}</span></p>
              <p className="font-semibold text-foreground">{job.progress}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(8, Math.min(100, job.progress))}%` }} />
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Files",
            value: repo?.totalFiles ?? analysisResult?.dependencyGraph.stats.totalNodes ?? 0,
            icon: <FileCode2 className="h-4 w-4" />,
          },
          {
            label: "Total Lines",
            value: repo?.totalLines ?? 0,
            icon: <Layers className="h-4 w-4" />,
          },
          {
            label: "Internal Links",
            value: analysisResult?.dependencyGraph.stats.totalEdges ?? 0,
            icon: <Link2 className="h-4 w-4" />,
          },
          {
            label: "Entry Points",
            value: analysisResult?.entryPoints.length ?? 0,
            icon: <GitBranch className="h-4 w-4" />,
          },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-border bg-surface px-5 py-4">
            <div className="flex items-center justify-between text-muted">
              <p className="text-xs uppercase tracking-[0.09em]">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
          </article>
        ))}
      </section>

      {analysisResult ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Executive Summary</h3>
              <div className="prose prose-invert mt-4 max-w-none text-sm leading-7 text-muted">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult.summary}</ReactMarkdown>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Architecture Pattern</h3>
              <p className="mt-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-semibold text-secondary">
                {analysisResult.architecture.pattern}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">{analysisResult.architecture.dataFlow}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {analysisResult.architecture.layers.map((layer) => (
                  <span key={layer} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-foreground">
                    {layer}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Tech Stack Profile</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stackSections.map((section) => (
                <div key={section.label} className="rounded-xl border border-border bg-surface-2 p-3">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.09em] text-secondary">
                    {section.icon}
                    {section.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(section.values.length > 0 ? section.values : ["Not detected"]).map((value) => (
                      <span key={`${section.label}-${value}`} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Core Modules</h3>
              <div className="mt-4 space-y-3">
                {analysisResult.architecture.modules.map((module) => (
                  <div key={`${module.name}-${module.path}`} className="rounded-xl border border-border bg-surface-2 p-3">
                    <p className="text-sm font-semibold text-foreground">{module.name}</p>
                    <p className="mt-1 text-xs text-secondary">{module.path}</p>
                    <p className="mt-2 text-sm text-muted">{module.responsibility}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {module.keyFiles.slice(0, 5).map((file) => (
                        <span key={file} className="rounded-full border border-border bg-surface px-2 py-1 text-xs text-foreground">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Entry Points</h3>
              <div className="mt-4 space-y-3">
                {analysisResult.entryPoints.slice(0, 10).map((entry) => (
                  <div key={entry.path} className="rounded-xl border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{entry.path}</p>
                      <span className="rounded-full border border-border bg-surface px-2 py-1 text-xs text-secondary">
                        score {entry.score}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{entry.reasons.join(" | ")}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <Network className="h-4 w-4" />
                Dependency Hotspots
              </h3>
              <div className="mt-4 space-y-2">
                {connectedFiles.map((file) => {
                  const max = connectedFiles[0]?.score ?? 1;
                  const width = `${Math.max(8, Math.round((file.score / max) * 100))}%`;

                  return (
                    <div key={file.path} className="rounded-xl border border-border bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-foreground">{file.path}</span>
                        <span className="text-xs text-secondary">{file.score} links</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-secondary" style={{ width }} />
                      </div>
                      <p className="mt-1 text-xs text-muted">{file.lines} lines</p>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">File Intelligence</h3>
              <div className="mt-4 space-y-2">
                {Object.entries(analysisResult.fileSummaries)
                  .slice(0, 12)
                  .map(([path, summary]) => (
                    <div key={path} className="rounded-xl border border-border bg-surface-2 p-3">
                      <p className="text-sm font-semibold text-foreground">{path}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{summary}</p>
                    </div>
                  ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Onboarding Guide</h3>
              <div className="prose prose-invert mt-4 max-w-none text-sm leading-7 text-muted">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult.startGuide}</ReactMarkdown>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <AlertTriangle className="h-4 w-4" />
                Risks and Issues
              </h3>
              <div className="mt-4 space-y-2">
                {analysisResult.architecture.issues.length > 0 ? (
                  analysisResult.architecture.issues.map((issue) => (
                    <div key={issue} className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      {issue}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                    <CircleCheckBig className="mr-2 inline-block h-4 w-4" />
                    No major architecture risks detected in this snapshot.
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysis artifacts are still being generated. This page will refresh automatically.
          </p>
        </section>
      )}
    </div>
  );
}
