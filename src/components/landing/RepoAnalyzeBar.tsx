"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, Github, Loader2 } from "lucide-react";
import { announceCreditsChanged } from "@/lib/creditBalance";

function parseGitHubRepo(value: string) {
  const normalized = value.trim().replace(/\/$/, "");
  const match = normalized.match(
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w./-]+))?$/
  );

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
    branch: match[3] ?? "HEAD",
  };
}

export function RepoAnalyzeBar() {
  const { status } = useSession();
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const parsedRepo = useMemo(() => parseGitHubRepo(githubUrl), [githubUrl]);
  const submitLabel = isSubmitting
    ? "Starting analysis"
    : status === "loading"
      ? "Preparing workspace"
      : status === "authenticated"
        ? "Analyze repository"
        : "Continue to analyze";

  async function analyzeRepository(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const repo = parseGitHubRepo(githubUrl);

    if (!repo) {
      setError("Enter a full public GitHub URL, such as https://github.com/vercel/next.js");
      return;
    }

    setError(null);

    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/user/dashboard&repoUrl=${encodeURIComponent(githubUrl)}`);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Analysis started. This can take a few minutes.");

    try {
      const response = await fetch("/api/repos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: githubUrl.trim().replace(/\/$/, "") }),
      });

      const payload = (await response.json()) as
        | { success: true; data: { cached?: boolean; repoId?: string; jobId?: string } }
        | { success: false; error: { message: string } };

      if (!response.ok || !payload.success) {
        if (response.status === 401) {
          router.push(`/login?callbackUrl=/user/dashboard&repoUrl=${encodeURIComponent(githubUrl)}`);
          return;
        }

        if (response.status === 402) announceCreditsChanged();
        setError(payload.success ? "Could not analyze this repository." : payload.error.message);
        return;
      }

      const repoId = payload.data.repoId ?? payload.data.jobId ?? "analysis";
      router.push(
        `/user/dashboard?repoId=${encodeURIComponent(repoId)}&repo=${encodeURIComponent(`${repo.owner}/${repo.repo}`)}`
      );
    } catch {
      setError("Something went wrong while starting the analysis. Please try again.");
    } finally {
      setIsSubmitting(false);
      setStatusMessage("");
    }
  }

  return (
    <form onSubmit={analyzeRepository} className="w-full" noValidate>
      <div className="analyze-card rounded-[1.75rem] border border-[#292721] bg-[#f7f2e7] p-2 shadow-[0_24px_70px_-45px_rgba(41,39,33,.55)] transition duration-500 focus-within:-translate-y-0.5 focus-within:shadow-[0_32px_80px_-42px_rgba(41,39,33,.62)] sm:p-3">
        <div className="flex items-center gap-3 border-b border-[#292721]/25 px-3 py-3 sm:px-4">
          <Github className="h-4 w-4 text-[#292721]" />
          <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">
            Public repository
          </span>
          <span aria-live="polite" className="ml-auto flex max-w-[50%] items-center gap-1.5 truncate text-[11px] text-[#5f7258]">
            <span className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#6f8666]" />
            <span className="truncate">{parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : "Ready"}</span>
          </span>
        </div>

        <div className="p-3 sm:p-4">
          <label htmlFor="github-url" className="text-sm font-medium text-[#292721]">
            GitHub repository URL
          </label>
          <input
            id="github-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={githubUrl}
            onChange={(event) => {
              setGithubUrl(event.target.value);
              if (error) setError(null);
            }}
            placeholder="https://github.com/owner/repository"
            aria-describedby={error ? "github-url-error" : "github-url-help"}
            aria-invalid={Boolean(error)}
            className={`mt-3 h-14 w-full rounded-xl border bg-transparent px-4 text-sm text-[#292721] outline-none transition duration-300 placeholder:text-[#8a8378] focus:bg-[#fffaf0] focus-visible:ring-2 sm:text-base ${
              error
                ? "border-[#a33f2b] focus-visible:ring-[#a33f2b]/25"
                : parsedRepo
                  ? "border-[#667a60] focus-visible:ring-[#667a60]/25"
                  : "border-[#292721]/35 focus:border-[#292721] focus-visible:ring-[#d75c3f]/35"
            }`}
          />

          <div className="mt-3 min-h-6">
            {error ? (
              <p id="github-url-error" role="alert" className="border-l-2 border-[#a33f2b] pl-3 text-xs leading-5 text-[#a33f2b]">
                {error}
              </p>
            ) : parsedRepo ? (
              <p id="github-url-help" className="flex items-center gap-2 text-xs text-[#5f7258]">
                <Check className="h-3.5 w-3.5" />
                Ready to inspect {parsedRepo.owner}/{parsedRepo.repo} on {parsedRepo.branch === "HEAD" ? "its default branch" : parsedRepo.branch}
              </p>
            ) : (
              <p id="github-url-help" className="text-xs text-[#777168]">
                Use a repository URL or a URL ending in /tree/branch-name.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status === "loading"}
            className="analyze-button group mt-4 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#292721] px-6 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="relative z-10 h-4 w-4 animate-spin" /> : null}
            <span className="relative z-10">{submitLabel}</span>
            {!isSubmitting ? <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
          </button>
        </div>
      </div>

      <div className="mt-5 grid border-l border-t border-[#292721]/25 font-mono text-[8px] uppercase tracking-[.11em] text-[#6d675f] sm:grid-cols-3">
        {["Read-only analysis", "Public repositories", "Account required"].map((claim) => (
          <span key={claim} className="flex items-center gap-2 border-b border-r border-[#292721]/25 px-3 py-2.5">
            <Check className="h-3 w-3 text-[#667a60]" />
            {claim}
          </span>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
    </form>
  );
}
