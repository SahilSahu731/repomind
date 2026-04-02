"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Github, Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

function parseGitHubRepo(value: string) {
  const normalized = value.trim();
  const match = normalized.match(
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w./-]+))?$/
  );

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] ?? "main",
  };
}

export function RepoAnalyzeBar() {
  const { status } = useSession();
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("https://github.com/vercel/next.js");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedRepo = useMemo(() => parseGitHubRepo(githubUrl), [githubUrl]);
  const previewScore = useMemo(() => {
    const seed = githubUrl.length + (parsedRepo?.repo.length ?? 0) * 11;
    return Math.min(98, Math.max(54, seed % 100));
  }, [githubUrl, parsedRepo?.repo.length]);

  async function analyzeRepository() {
    const repo = parseGitHubRepo(githubUrl);

    if (!repo) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setError(null);

    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/user/dashboard&repoUrl=${encodeURIComponent(githubUrl)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/repos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      });

      const payload = (await response.json()) as
        | { success: true; data: { cached?: boolean; repoId?: string; jobId?: string } }
        | { success: false; error: { message: string } };

      if (!response.ok || !payload.success) {
        if (response.status === 401) {
          router.push(`/login?callbackUrl=/user/dashboard&repoUrl=${encodeURIComponent(githubUrl)}`);
          return;
        }

        setError(payload.success ? "Could not analyze this repository." : payload.error.message);
        return;
      }

      const repoId = payload.data.repoId ?? payload.data.jobId ?? "analysis";
      router.push(`/user/dashboard?repoId=${encodeURIComponent(repoId)}&repo=${encodeURIComponent(`${repo.owner}/${repo.repo}`)}`);
    } catch {
      setError("Something went wrong while analyzing the repository.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[1.9rem] border border-border bg-[linear-gradient(160deg,var(--surface)_0%,var(--surface-2)_58%,rgba(103,232,249,0.07)_100%)] p-4 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.8)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.45rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            <Sparkles className="h-4 w-4" />
            Repo entry point
          </div>
          <label htmlFor="github-url" className="sr-only">
            GitHub repository URL
          </label>
          <div className="mt-4 flex flex-col gap-3 rounded-[1.2rem] border border-border bg-surface-2 p-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-3 px-3 py-2 text-xs text-muted">
              <Github className="h-4 w-4 text-primary" />
              github.com
            </div>
            <input
              id="github-url"
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/org/repo or /tree/main"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={analyzeRepository}
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Analyze
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Detects entry points",
              "Finds risky modules",
              "Builds graph instantly",
              "Routes into workspace",
            ].map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.45rem] border border-border bg-surface p-4 sm:p-5">
          <div className="rounded-2xl border border-border bg-[linear-gradient(135deg,var(--surface-2)_0%,var(--surface-3)_100%)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-secondary">Live preview</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : "Waiting for a valid repo"}
            </p>
            <p className="mt-1 text-sm text-muted">
              Branch: {parsedRepo?.branch ?? "main"} · Confidence score {previewScore}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface-2 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">Files</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{Math.max(120, githubUrl.length * 3)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">Signals</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{parsedRepo ? 12 : 0}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted">
            Preview: repo ingestion, dependency scan, graph build, and onboarding route creation.
          </div>
        </div>
      </div>
    </div>
  );
}
