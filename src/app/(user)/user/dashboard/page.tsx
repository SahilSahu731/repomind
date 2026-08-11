"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CircleCheckBig,
  Clock3,
  FileCode2,
  GitBranch,
  Layers,
  Link2,
  Loader2,
} from "lucide-react";
import type { AnalysisResult } from "@/types";
import type { JobRow, RepoRow } from "@/lib/supabaseDb";
import { announceCreditsChanged } from "@/lib/creditBalance";
import { RepositoryAnalysisReport } from "@/components/report/RepositoryAnalysisReport";
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
  error: { code: string; message: string };
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
    if (!repoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/repos/${encodeURIComponent(repoId)}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as RepoDetailsResponse | RepoDetailsError;

      if (!response.ok || !payload.success) {
        setError(payload.success ? "Unable to load repository analysis" : payload.error.message);
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
    if (!repoId) return;
    const shouldPoll = Boolean(repoStatus && repoStatus !== "COMPLETE" && repoStatus !== "FAILED");
    if (!shouldPoll) return;

    const interval = window.setInterval(() => void loadRepoDetails(), 3500);
    return () => window.clearInterval(interval);
  }, [loadRepoDetails, repoId, repoStatus]);

  useEffect(() => {
    if (repoStatus === "COMPLETE" || repoStatus === "FAILED") {
      announceCreditsChanged();
    }
  }, [repoStatus]);

  if (!repoId) return <RepositoryWorkspace />;

  const progress = Math.max(0, Math.min(100, job?.progress ?? 0));

  return (
    <div className="space-y-9">
      <section className="border-b border-[#292721] pb-8">
        <Link
          href="/user/dashboard"
          className="group mb-6 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f] transition hover:text-[#292721]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Repository workspace
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">Repository intelligence report</p>
            <h2 className="mt-4 break-words font-serif text-5xl font-normal leading-[.94] tracking-[-.055em] text-[#292721] sm:text-6xl">
              {repo ? `${repo.owner}/${repo.name}` : repoSlug ?? "Loading repository"}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[.13em] text-[#6d675f]">
              <span>Branch / {repo?.branch === "HEAD" ? "Default" : repo?.branch ?? "Resolving"}</span>
              {repo?.defaultLanguage ? <><span aria-hidden="true">·</span><span>{repo.defaultLanguage}</span></> : null}
              {repo?.analyzedAt ? <><span aria-hidden="true">·</span><span>Analyzed {new Date(repo.analyzedAt).toLocaleDateString()}</span></> : null}
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] ${statusTone(repo?.status ?? "QUEUED")}`}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : repo?.status === "COMPLETE" ? <CircleCheckBig className="h-3.5 w-3.5" /> : repo?.status === "FAILED" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {formatStatus(repo?.status ?? "QUEUED")}
          </div>
        </div>

        {error && repo ? <div className="mt-5 border-l-2 border-[#a33f2b] bg-[#ead8cf] px-4 py-3 text-sm text-[#82331f]">{error}</div> : null}

        {job && repo?.status !== "COMPLETE" && repo?.status !== "FAILED" ? (
          <div className="mt-7 border border-[#292721] bg-[#e8dfcf] p-5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-[#6d675f]">Current step: <span className="font-semibold text-[#292721]">{formatStatus(job.currentStep ?? "processing")}</span></p>
              <p className="font-mono text-xs font-semibold text-[#292721]">{progress}%</p>
            </div>
            <div className="mt-4 h-1.5 bg-[#cfc3af]" role="progressbar" aria-label="Repository analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full bg-[#d75c3f] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1" aria-hidden="true">
              {["Clone", "Map", "Understand", "Report"].map((step, index) => (
                <div key={step} className={`border-t pt-2 font-mono text-[7px] uppercase tracking-[.1em] ${progress >= index * 25 ? "border-[#d75c3f] text-[#8c3826]" : "border-[#292721]/20 text-[#8a8378]"}`}>{step}</div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid border-l border-t border-[#292721] sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total files", repo?.totalFiles ?? analysisResult?.dependencyGraph.stats.totalNodes ?? 0, FileCode2],
          ["Total lines", repo?.totalLines ?? 0, Layers],
          ["Internal links", analysisResult?.dependencyGraph.stats.totalEdges ?? 0, Link2],
          ["Entry points", analysisResult?.entryPoints.length ?? 0, GitBranch],
        ].map(([label, rawValue, Icon]) => {
          const MetricIcon = Icon as typeof FileCode2;
          const value = rawValue as number;
          return (
            <article key={label as string} className="border-b border-r border-[#292721] bg-[#f7f2e7]/65 px-5 py-5">
              <div className="flex items-center justify-between text-[#6d675f]">
                <p className="font-mono text-[8px] uppercase tracking-[.14em]">{label as string}</p>
                <MetricIcon className="h-4 w-4" />
              </div>
              <p className="mt-5 font-serif text-4xl tracking-[-.05em] text-[#292721]">{value.toLocaleString()}</p>
            </article>
          );
        })}
      </section>

      {analysisResult && repo ? (
        <RepositoryAnalysisReport repo={repo} analysis={analysisResult} />
      ) : repo?.status === "FAILED" ? (
        <section className="border border-[#a33f2b] bg-[#ead8cf] p-6 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#82331f]">Analysis stopped</p>
          <h3 className="mt-3 font-serif text-3xl tracking-[-.04em] text-[#292721]">This repository could not be analyzed.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d4a42]">{analysisFailureMessage(repo, job)}</p>
          <Link href="/user/dashboard" className="mt-6 inline-flex h-11 items-center gap-2 bg-[#292721] px-5 text-xs font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f]">
            <ArrowLeft className="h-3.5 w-3.5" /> Return and try again
          </Link>
        </section>
      ) : error && !repo ? (
        <section className="border border-[#a33f2b] bg-[#ead8cf] p-6">
          <p className="text-sm text-[#82331f]">{error}</p>
          <button type="button" onClick={() => void loadRepoDetails()} className="mt-4 text-xs font-semibold underline decoration-[#a33f2b] underline-offset-4">Try loading again</button>
        </section>
      ) : (
        <section className="border border-[#292721] bg-[#e8dfcf] p-6" aria-live="polite">
          <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c94f34]">Analysis in progress</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-[#5e5952]"><Loader2 className="h-4 w-4 animate-spin text-[#d75c3f]" />Artifacts are being generated. This report refreshes automatically.</div>
        </section>
      )}
    </div>
  );
}
