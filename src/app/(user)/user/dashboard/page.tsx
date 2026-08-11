"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
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
import { RepositoryWorkspace } from "@/components/workspace/RepositoryWorkspace";

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
    return "border-[#667a60] bg-[#dfe5d8] text-[#43533f]";
  }
  if (status === "FAILED" || status === "TIMEOUT") {
    return "border-[#a33f2b] bg-[#ead8cf] text-[#82331f]";
  }
  return "border-[#d75c3f] bg-[#f0d9cf] text-[#8c3826]";
}

function analysisFailureMessage(repo: RepoRow, job: JobRow | null): string {
  const detail = repo.errorMessage ?? job?.errorLog ?? "";

  if (detail.includes("REPO_NOT_FOUND")) {
    return "GitHub could not find this public repository. Check the URL and repository visibility, then try again.";
  }
  if (detail.includes("BRANCH_NOT_FOUND")) {
    return "That branch no longer exists. Use the repository URL without /tree/… to analyze its default branch.";
  }
  if (/could not resolve host|network|timed?\s*out/i.test(detail)) {
    return "GitHub could not be reached while cloning. Check your connection and try the analysis again.";
  }
  if (detail.includes("CREDITS_EXHAUSTED")) {
    return "This analysis could not finish because the workspace has no credits remaining.";
  }

  return "The repository could not be cloned or processed. Confirm that it is public, then submit it again.";
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
  const repoStatus = repo?.status;

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

    const shouldPoll = Boolean(
      repoStatus && repoStatus !== "COMPLETE" && repoStatus !== "FAILED"
    );

    if (!shouldPoll) {
      return;
    }

    const interval = setInterval(() => {
      void loadRepoDetails();
    }, 3500);

    return () => clearInterval(interval);
  }, [loadRepoDetails, repoId, repoStatus]);

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
    return <RepositoryWorkspace />;
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-[#292721] pb-8">
        <Link
          href="/user/dashboard"
          className="group mb-6 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f] transition hover:text-[#292721]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          All repository workspaces
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">Live repository report</p>
            <h2 className="mt-4 font-serif text-5xl font-normal leading-none tracking-[-.055em] text-[#292721] sm:text-6xl">
              {repo ? `${repo.owner}/${repo.name}` : (repoSlug ?? "Loading repository")}
            </h2>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[.13em] text-[#6d675f]">
              Branch / {repo?.branch === "HEAD" ? "Default branch" : (repo?.branch ?? "Resolving")}
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] ${statusTone(repo?.status ?? "QUEUED")}`}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : repo?.status === "COMPLETE" ? (
              <CircleCheckBig className="h-3.5 w-3.5" />
            ) : repo?.status === "FAILED" ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <Clock3 className="h-3.5 w-3.5" />
            )}
            {formatStatus(repo?.status ?? "QUEUED")}
          </div>
        </div>

        {error && repo && (
          <div className="mt-5 border-l-2 border-[#a33f2b] bg-[#ead8cf] px-4 py-3 text-sm text-[#82331f]">
            {error}
          </div>
        )}

        {job && repo?.status !== "COMPLETE" && repo?.status !== "FAILED" && (
          <div className="mt-6 border border-[#292721]/35 bg-[#e8dfcf] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-[#6d675f]">Current step: <span className="font-semibold text-[#292721]">{formatStatus(job.currentStep ?? "processing")}</span></p>
              <p className="font-semibold text-[#292721]">{job.progress}%</p>
            </div>
            <div
              className="mt-3 h-1.5 bg-[#cfc3af]"
              role="progressbar"
              aria-label="Repository analysis progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(0, Math.min(100, job.progress))}
            >
              <div className="h-full bg-[#d75c3f] transition-all" style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }} />
            </div>
          </div>
        )}
      </section>

      <section className="grid border-l border-t border-[#292721] sm:grid-cols-2 lg:grid-cols-4">
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
          <article key={item.label} className="border-b border-r border-[#292721] bg-[#f7f2e7]/65 px-5 py-5">
            <div className="flex items-center justify-between text-[#6d675f]">
              <p className="font-mono text-[8px] uppercase tracking-[.14em]">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-5 font-serif text-4xl tracking-[-.05em] text-[#292721]">{item.value.toLocaleString()}</p>
          </article>
        ))}
      </section>

      {analysisResult ? (
        <>
          <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1.2fr_0.8fr]">
            <article className="bg-[#f7f2e7] p-6 sm:p-8">
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">01 / Overview</p>
              <h3 className="mt-3 font-serif text-3xl tracking-[-.04em] text-[#292721]">Executive summary</h3>
              <div className="dashboard-markdown mt-5 max-w-none text-sm leading-7 text-[#5e5952]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult.summary}</ReactMarkdown>
              </div>
            </article>

            <article className="bg-[#e8dfcf] p-6 sm:p-8">
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">02 / System</p>
              <h3 className="mt-3 font-serif text-3xl tracking-[-.04em] text-[#292721]">Architecture pattern</h3>
              <p className="mt-5 border-l-2 border-[#d75c3f] pl-4 text-base font-semibold text-[#43533f]">
                {analysisResult.architecture.pattern}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#5e5952]">{analysisResult.architecture.dataFlow}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {analysisResult.architecture.layers.map((layer) => (
                  <span key={layer} className="rounded-full border border-[#292721]/35 px-3 py-1 text-xs text-[#292721]">
                    {layer}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="border-y border-[#292721] py-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">03 / Detected tools</p>
                <h3 className="mt-2 font-serif text-3xl tracking-[-.04em] text-[#292721]">Technology profile</h3>
              </div>
              <p className="hidden max-w-[24rem] text-right text-xs leading-5 text-[#6d675f] sm:block">The languages, frameworks, infrastructure, and delivery tooling found in this snapshot.</p>
            </div>
            <div className="mt-6 grid border-l border-t border-[#292721]/45 sm:grid-cols-2 lg:grid-cols-3">
              {stackSections.map((section) => (
                <div key={section.label} className="border-b border-r border-[#292721]/45 bg-[#f7f2e7]/60 p-4">
                  <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.13em] text-[#667a60]">
                    {section.icon}
                    {section.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(section.values.length > 0 ? section.values : ["Not detected"]).map((value) => (
                      <span key={`${section.label}-${value}`} className="rounded-full border border-[#292721]/30 px-2.5 py-1 text-xs text-[#292721]">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <article>
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">04 / Composition</p>
              <h3 className="mt-2 border-b border-[#292721] pb-4 font-serif text-3xl tracking-[-.04em] text-[#292721]">Core modules</h3>
              <div className="divide-y divide-[#292721]/25">
                {analysisResult.architecture.modules.map((module) => (
                  <div key={`${module.name}-${module.path}`} className="py-4">
                    <p className="text-sm font-semibold text-[#292721]">{module.name}</p>
                    <p className="mt-1 font-mono text-[9px] text-[#667a60]">{module.path}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6d675f]">{module.responsibility}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {module.keyFiles.slice(0, 5).map((file) => (
                        <span key={file} className="rounded-full border border-[#292721]/25 px-2 py-1 font-mono text-[9px] text-[#292721]">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article>
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">05 / Orientation</p>
              <h3 className="mt-2 border-b border-[#292721] pb-4 font-serif text-3xl tracking-[-.04em] text-[#292721]">Entry points</h3>
              <div className="divide-y divide-[#292721]/25">
                {analysisResult.entryPoints.slice(0, 10).map((entry) => (
                  <div key={entry.path} className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#292721]">{entry.path}</p>
                      <span className="rounded-full border border-[#292721]/30 px-2 py-1 font-mono text-[9px] text-[#667a60]">
                        score {entry.score}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#6d675f]">{entry.reasons.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1fr_1fr]">
            <article className="bg-[#e8dfcf] p-6 sm:p-8">
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">06 / Connections</p>
              <h3 className="mt-2 flex items-center gap-2 font-serif text-3xl tracking-[-.04em] text-[#292721]">
                <Network className="h-4 w-4" />
                Dependency hotspots
              </h3>
              <div className="mt-5 divide-y divide-[#292721]/25 border-t border-[#292721]/25">
                {connectedFiles.map((file) => {
                  const max = connectedFiles[0]?.score ?? 1;
                  const width = `${Math.max(8, Math.round((file.score / max) * 100))}%`;

                  return (
                    <div key={file.path} className="py-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-mono text-[10px] text-[#292721]">{file.path}</span>
                        <span className="text-xs text-[#667a60]">{file.score} links</span>
                      </div>
                      <div className="mt-2 h-1 bg-[#cfc3af]">
                        <div className="h-full bg-[#d75c3f]" style={{ width }} />
                      </div>
                      <p className="mt-1 text-[10px] text-[#777168]">{file.lines} lines</p>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="bg-[#f7f2e7] p-6 sm:p-8">
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">07 / Context</p>
              <h3 className="mt-2 font-serif text-3xl tracking-[-.04em] text-[#292721]">File intelligence</h3>
              <div className="mt-5 divide-y divide-[#292721]/25 border-t border-[#292721]/25">
                {Object.entries(analysisResult.fileSummaries)
                  .slice(0, 12)
                  .map(([path, summary]) => (
                    <div key={path} className="py-3">
                      <p className="font-mono text-[10px] font-semibold text-[#292721]">{path}</p>
                      <p className="mt-1 text-sm leading-6 text-[#6d675f]">{summary}</p>
                    </div>
                  ))}
              </div>
            </article>
          </section>

          <section className="grid gap-8 border-t border-[#292721] pt-8 lg:grid-cols-[1.15fr_.85fr]">
            <article>
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">08 / First steps</p>
              <h3 className="mt-2 font-serif text-3xl tracking-[-.04em] text-[#292721]">Onboarding guide</h3>
              <div className="dashboard-markdown mt-5 max-w-none text-sm leading-7 text-[#5e5952]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult.startGuide}</ReactMarkdown>
              </div>
            </article>

            <article className="bg-[#e8dfcf] p-6">
              <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">09 / Review</p>
              <h3 className="mt-2 flex items-center gap-2 font-serif text-3xl tracking-[-.04em] text-[#292721]">
                <AlertTriangle className="h-4 w-4" />
                Risks and issues
              </h3>
              <div className="mt-4 space-y-2">
                {analysisResult.architecture.issues.length > 0 ? (
                  analysisResult.architecture.issues.map((issue) => (
                    <div key={issue} className="border-l-2 border-[#b56c25] bg-[#ead8b8] px-3 py-2 text-sm text-[#744a20]">
                      {issue}
                    </div>
                  ))
                ) : (
                  <div className="border-l-2 border-[#667a60] bg-[#dfe5d8] px-3 py-2 text-sm text-[#43533f]">
                    <CircleCheckBig className="mr-2 inline-block h-4 w-4" />
                    No major architecture risks detected in this snapshot.
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      ) : repo?.status === "FAILED" ? (
        <section className="border border-[#a33f2b] bg-[#ead8cf] p-6 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#82331f]">Analysis stopped</p>
          <h3 className="mt-3 font-serif text-3xl tracking-[-.04em] text-[#292721]">
            This repository could not be analyzed.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d4a42]">
            {analysisFailureMessage(repo, job)}
          </p>
          <Link
            href="/user/dashboard"
            className="mt-6 inline-flex h-11 items-center gap-2 bg-[#292721] px-5 text-xs font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return and try again
          </Link>
        </section>
      ) : error && !repo ? (
        <section className="border border-[#a33f2b] bg-[#ead8cf] p-6">
          <p className="text-sm text-[#82331f]">{error}</p>
          <button type="button" onClick={() => void loadRepoDetails()} className="mt-4 text-xs font-semibold underline decoration-[#a33f2b] underline-offset-4">
            Try loading again
          </button>
        </section>
      ) : (
        <section className="border border-[#292721] bg-[#e8dfcf] p-6" aria-live="polite">
          <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">Analysis in progress</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-[#5e5952]">
            <Loader2 className="h-4 w-4 animate-spin text-[#d75c3f]" />
            Artifacts are being generated. This report refreshes automatically.
          </div>
        </section>
      )}
    </div>
  );
}
