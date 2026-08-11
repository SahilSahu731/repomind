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
  ShieldCheck,
} from "lucide-react";
import type { AnalysisResult } from "@/types";
import type { JobRow, RepoRow } from "@/lib/supabaseDb";
import { RepoAnalyzeBar } from "@/components/landing/RepoAnalyzeBar";

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
      <div>
        <section className="grid min-h-[calc(100svh-13rem)] items-center gap-12 py-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:py-10">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">Workspace / Ready for input</p>
            <h2 className="mt-5 max-w-[9ch] font-serif text-[clamp(4rem,7.2vw,7.5rem)] font-normal leading-[.84] tracking-[-.06em] text-[#292721]">
              See the system before the syntax.
            </h2>
            <p className="mt-7 max-w-[34rem] text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8">
              Turn any public repository into a practical map of its architecture, dependencies, entry points, and safest route in.
            </p>

            <div className="mt-8 grid max-w-[34rem] grid-cols-3 border-y border-[#292721] py-4">
              {[
                ["01", "Map structure"],
                ["02", "Trace flow"],
                ["03", "Start well"],
              ].map(([number, label]) => (
                <div key={number}>
                  <p className="font-mono text-[8px] tracking-[.15em] text-[#c94f34]">{number}</p>
                  <p className="mt-1.5 text-xs text-[#5e5952] sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="mb-5 flex items-center justify-between border-b border-[#292721]/25 pb-4">
              <div>
                <p className="font-serif text-2xl tracking-[-.035em]">Begin an analysis</p>
                <p className="mt-1 text-xs text-[#6d675f]">Paste a public GitHub repository below.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-[#667a60]" />
            </div>
            <RepoAnalyzeBar />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-[#292721] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">Live repository report</p>
            <h2 className="mt-4 font-serif text-5xl font-normal leading-none tracking-[-.055em] text-[#292721] sm:text-6xl">
              {repo ? `${repo.owner}/${repo.name}` : (repoSlug ?? "Loading repository")}
            </h2>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[.13em] text-[#6d675f]">Branch / {repo?.branch ?? "main"}</p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] ${statusTone(repo?.status ?? "QUEUED")}`}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
            {formatStatus(repo?.status ?? "QUEUED")}
          </div>
        </div>

        {error && (
          <div className="mt-5 border-l-2 border-[#a33f2b] bg-[#ead8cf] px-4 py-3 text-sm text-[#82331f]">
            {error}
          </div>
        )}

        {job && repo?.status !== "COMPLETE" && repo?.status !== "FAILED" && (
          <div className="mt-6 border border-[#292721]/35 bg-[#e8dfcf] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-[#6d675f]">Current step: <span className="font-semibold text-[#292721]">{job.currentStep ?? "processing"}</span></p>
              <p className="font-semibold text-[#292721]">{job.progress}%</p>
            </div>
            <div className="mt-3 h-1.5 bg-[#cfc3af]">
              <div className="h-full bg-[#d75c3f] transition-all" style={{ width: `${Math.max(8, Math.min(100, job.progress))}%` }} />
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
      ) : (
        <section className="border border-[#292721] bg-[#e8dfcf] p-6">
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
