"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheckBig,
  Clock3,
  FileCode2,
  FolderGit2,
  GitBranch,
  Github,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { RepoRow } from "@/lib/supabaseDb";
import { RepoAnalyzeBar } from "@/components/landing/RepoAnalyzeBar";

type WorkspaceFilter = "all" | "complete" | "in-progress" | "failed";

interface RepositoriesResponse {
  success: true;
  data: {
    repos: RepoRow[];
    total: number;
    page: number;
    totalPages: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

const ACTIVE_STATUSES = new Set(["QUEUED", "CLONING", "PARSING", "ANALYZING"]);

const FILTERS: Array<{ value: WorkspaceFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "complete", label: "Ready" },
  { value: "in-progress", label: "In progress" },
  { value: "failed", label: "Needs attention" },
];

function formatStatus(status: string): string {
  if (status === "COMPLETE") return "Report ready";
  if (status === "FAILED") return "Needs attention";

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string): string {
  if (status === "COMPLETE") {
    return "border-[#667a60] bg-[#dfe5d8] text-[#43533f]";
  }
  if (status === "FAILED") {
    return "border-[#a33f2b] bg-[#ead8cf] text-[#82331f]";
  }
  return "border-[#d75c3f] bg-[#f0d9cf] text-[#8c3826]";
}

function formatDate(value?: string | null): string {
  if (!value) return "Not completed yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function matchesFilter(repo: RepoRow, filter: WorkspaceFilter): boolean {
  if (filter === "complete") return repo.status === "COMPLETE";
  if (filter === "failed") return repo.status === "FAILED";
  if (filter === "in-progress") return ACTIVE_STATUSES.has(repo.status);
  return true;
}

function countForFilter(repos: RepoRow[], filter: WorkspaceFilter): number {
  return repos.filter((repo) => matchesFilter(repo, filter)).length;
}

function EmptyWorkspace() {
  return (
    <section className="grid min-h-[calc(100svh-13rem)] items-center gap-12 py-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:py-10">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">
          Personal workspace / Ready for input
        </p>
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
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-label="Loading repository workspace" role="status" className="space-y-8 py-4">
      <div className="h-40 animate-pulse border border-[#292721]/25 bg-[#e8dfcf]/65" />
      <div className="grid gap-px border border-[#292721]/25 bg-[#292721]/25 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-56 animate-pulse bg-[#f7f2e7]/80 p-6">
            <div className="h-2 w-24 bg-[#cfc3af]" />
            <div className="mt-8 h-8 w-2/3 bg-[#ded4c2]" />
            <div className="mt-4 h-3 w-1/3 bg-[#ded4c2]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading repositories</span>
    </div>
  );
}

export function RepositoryWorkspace() {
  const router = useRouter();
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WorkspaceFilter>("all");
  const [query, setQuery] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRepositories = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);
    setListError(null);

    try {
      const response = await fetch("/api/repos?page=1&limit=50&status=all", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as RepositoriesResponse | ApiErrorResponse;

      if (!response.ok || !payload.success) {
        setListError(payload.success ? "Unable to load your repositories." : payload.error.message);
        return;
      }

      setRepos(payload.data.repos);
      setTotal(payload.data.total);
    } catch {
      setListError("Unable to load your repository workspace. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRepositories();
  }, [loadRepositories]);

  const hasActiveRepos = repos.some((repo) => ACTIVE_STATUSES.has(repo.status));

  useEffect(() => {
    if (!hasActiveRepos) return;

    const interval = window.setInterval(() => {
      void loadRepositories(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [hasActiveRepos, loadRepositories]);

  const visibleRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return repos.filter((repo) => {
      const matchesStatus = matchesFilter(repo, filter);
      const matchesQuery =
        !normalizedQuery ||
        `${repo.owner}/${repo.name}`.toLowerCase().includes(normalizedQuery) ||
        repo.branch.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [filter, query, repos]);

  async function startAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = githubUrl.trim().replace(/\/$/, "");

    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/tree\/[\w./-]+)?$/.test(normalizedUrl)) {
      setAnalyzeError("Enter a full public GitHub repository URL.");
      return;
    }

    setIsSubmitting(true);
    setAnalyzeError(null);

    try {
      const response = await fetch("/api/repos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: normalizedUrl }),
      });
      const payload = (await response.json()) as
        | { success: true; data: { repoId?: string } }
        | ApiErrorResponse;

      if (!response.ok || !payload.success || !payload.data.repoId) {
        setAnalyzeError(
          payload.success ? "The analysis could not be started. Please try again." : payload.error.message
        );
        return;
      }

      const match = normalizedUrl.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/);
      const repoLabel = match ? `${match[1]}/${match[2]}` : "repository";
      router.push(
        `/user/dashboard?repoId=${encodeURIComponent(payload.data.repoId)}&repo=${encodeURIComponent(repoLabel)}`
      );
    } catch {
      setAnalyzeError("Something went wrong while starting the analysis. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <WorkspaceSkeleton />;
  if (!listError && repos.length === 0) return <EmptyWorkspace />;

  return (
    <div className="space-y-8 py-2">
      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1.05fr_.95fr]">
        <div className="bg-[#f7f2e7] p-6 sm:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">
            Personal workspace / Repository shelf
          </p>
          <h2 className="mt-5 max-w-[12ch] font-serif text-[clamp(3.2rem,6vw,6.5rem)] font-normal leading-[.86] tracking-[-.06em] text-[#292721]">
            Your systems, ready to reopen.
          </h2>
          <p className="mt-5 max-w-[38rem] text-sm leading-6 text-[#5e5952] sm:text-base sm:leading-7">
            Keep every architecture map, dependency trail, and onboarding guide in one durable place.
          </p>
        </div>

        <div className="bg-[#e8dfcf] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-[#292721]/30 pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">New analysis</p>
              <h3 className="mt-1 font-serif text-2xl tracking-[-.04em]">Add a repository</h3>
            </div>
            <Plus className="h-5 w-5 text-[#d75c3f]" />
          </div>

          <form onSubmit={startAnalysis} className="mt-5">
            <label htmlFor="workspace-github-url" className="sr-only">GitHub repository URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Github className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d675f]" />
                <input
                  id="workspace-github-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={githubUrl}
                  onChange={(event) => {
                    setGithubUrl(event.target.value);
                    if (analyzeError) setAnalyzeError(null);
                  }}
                  placeholder="https://github.com/owner/repository"
                  aria-invalid={Boolean(analyzeError)}
                  aria-describedby={analyzeError ? "workspace-analyze-error" : undefined}
                  className="h-12 w-full border border-[#292721]/40 bg-[#f7f2e7] pl-11 pr-4 text-sm text-[#292721] outline-none transition placeholder:text-[#8a8378] focus:border-[#292721] focus:ring-2 focus:ring-[#d75c3f]/25"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-[#292721] px-5 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Starting" : "Analyze"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
              </button>
            </div>
            {analyzeError ? (
              <p id="workspace-analyze-error" role="alert" className="mt-3 border-l-2 border-[#a33f2b] pl-3 text-xs leading-5 text-[#82331f]">
                {analyzeError}
              </p>
            ) : (
              <p className="mt-3 text-xs text-[#6d675f]">Public repositories · read-only analysis</p>
            )}
          </form>
        </div>
      </section>

      <section aria-labelledby="repository-workspaces-heading">
        <div className="flex flex-col gap-5 border-b border-[#292721] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">Repository index</p>
              {isRefreshing ? <Loader2 aria-label="Refreshing repositories" className="h-3 w-3 animate-spin text-[#d75c3f]" /> : null}
            </div>
            <h3 id="repository-workspaces-heading" className="mt-2 font-serif text-4xl tracking-[-.05em] text-[#292721]">
              Your workspaces
            </h3>
            <p className="mt-2 text-xs text-[#6d675f]">
              {total} {total === 1 ? "repository" : "repositories"} saved to this account
            </p>
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d675f]" />
            <label htmlFor="workspace-search" className="sr-only">Search repositories</label>
            <input
              id="workspace-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search owner, repo, or branch"
              className="h-11 w-full border border-[#292721]/40 bg-[#f7f2e7]/80 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#8a8378] focus:border-[#292721] focus:ring-2 focus:ring-[#d75c3f]/20"
            />
          </div>
        </div>

        {listError ? (
          <div role="alert" className="mt-6 flex flex-col gap-4 border border-[#a33f2b] bg-[#ead8cf] p-5 text-[#82331f] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Your repository shelf could not be loaded.</p>
              <p className="mt-1 text-xs leading-5">{listError}</p>
            </div>
            <button type="button" onClick={() => void loadRepositories()} className="inline-flex h-10 items-center justify-center gap-2 border border-[#82331f] px-4 text-xs font-medium transition hover:bg-[#82331f] hover:text-[#f7f2e7]">
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : (
          <>
            <div aria-label="Filter repository workspaces" className="flex overflow-x-auto border-b border-[#292721]/30 py-3">
              {FILTERS.map((item) => {
                const count = countForFilter(repos, item.value);
                const isActive = filter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setFilter(item.value)}
                    className={`flex shrink-0 items-center gap-2 border-r border-[#292721]/25 px-4 py-1.5 text-xs transition first:pl-0 ${
                      isActive ? "font-semibold text-[#292721]" : "text-[#6d675f] hover:text-[#292721]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#d75c3f]" : "bg-[#aaa292]"}`} />
                    {item.label}
                    <span className="font-mono text-[8px] text-[#8a8378]">{count.toString().padStart(2, "0")}</span>
                  </button>
                );
              })}
            </div>

            {visibleRepos.length > 0 ? (
              <div className="grid gap-px border-x border-b border-[#292721] bg-[#292721] lg:grid-cols-2">
                {visibleRepos.map((repo, index) => {
                  const isActive = ACTIVE_STATUSES.has(repo.status);
                  const action = repo.status === "COMPLETE" ? "Open report" : isActive ? "View progress" : "Review failure";
                  const href = `/user/dashboard?repoId=${encodeURIComponent(repo.id)}&repo=${encodeURIComponent(`${repo.owner}/${repo.name}`)}`;

                  return (
                    <article key={repo.id} className="group relative flex min-h-64 flex-col bg-[#f7f2e7] p-5 transition-colors hover:bg-[#fffaf0] sm:p-6">
                      <span className="absolute inset-y-0 left-0 w-0 bg-[#d75c3f] transition-all group-hover:w-1" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center border border-[#292721]/40 bg-[#e8dfcf]">
                            <FolderGit2 className="h-4 w-4 text-[#292721]" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">{repo.owner}</p>
                            <h4 className="mt-1 truncate font-serif text-3xl tracking-[-.045em] text-[#292721]">{repo.name}</h4>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.1em] ${statusTone(repo.status)}`}>
                          {isActive ? <Clock3 className="h-3 w-3" /> : repo.status === "COMPLETE" ? <CircleCheckBig className="h-3 w-3" /> : null}
                          {formatStatus(repo.status)}
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-3 border-y border-[#292721]/25 py-3 text-xs text-[#5e5952]">
                        <div>
                          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#8a8378]">Branch</p>
                          <p className="mt-1 flex items-center gap-1.5 truncate"><GitBranch className="h-3 w-3" /> {repo.branch === "HEAD" ? "Default" : repo.branch}</p>
                        </div>
                        <div className="border-l border-[#292721]/20 pl-3">
                          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#8a8378]">Files</p>
                          <p className="mt-1 flex items-center gap-1.5"><FileCode2 className="h-3 w-3" /> {repo.totalFiles?.toLocaleString() ?? "—"}</p>
                        </div>
                        <div className="border-l border-[#292721]/20 pl-3">
                          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#8a8378]">Language</p>
                          <p className="mt-1 truncate">{repo.defaultLanguage ?? "Pending"}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                        <div>
                          <p className="font-mono text-[7px] uppercase tracking-[.13em] text-[#8a8378]">
                            {repo.status === "COMPLETE" ? "Analyzed" : "Submitted"}
                          </p>
                          <p className="mt-1 text-xs text-[#6d675f]">{formatDate(repo.analyzedAt ?? repo.createdAt)}</p>
                        </div>
                        <Link href={href} className="group/link inline-flex items-center gap-2 text-xs font-semibold text-[#292721] underline decoration-[#d75c3f] underline-offset-4">
                          {action}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                      </div>

                      <span className="pointer-events-none absolute right-5 top-[5.35rem] font-mono text-[7px] tracking-[.12em] text-[#aaa292] sm:right-6">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="border-x border-b border-[#292721] bg-[#e8dfcf]/65 px-6 py-14 text-center">
                <FolderGit2 className="mx-auto h-6 w-6 text-[#6d675f]" />
                <p className="mt-4 font-serif text-2xl tracking-[-.035em]">No repositories match this view.</p>
                <p className="mt-2 text-sm text-[#6d675f]">Try a different status or search phrase.</p>
                <button type="button" onClick={() => { setFilter("all"); setQuery(""); }} className="mt-5 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
