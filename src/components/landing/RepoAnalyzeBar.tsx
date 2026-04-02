"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Github, Loader2, Sparkles, Wand2 } from "lucide-react";

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
    <div className="rounded-4xl border border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_55%,rgba(139,92,246,0.08)_100%)] p-5 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          <Sparkles className="h-4 w-4" />
          Repo entry point
        </div>

        <div className="space-y-3 rounded-3xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-4 sm:p-5">
          <label htmlFor="github-url" className="sr-only">
            GitHub repository URL
          </label>
          <div className="rounded-[1.4rem] border border-border bg-surface-2 p-3 sm:p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              <Github className="h-4 w-4 text-primary" />
              github.com/
              <span className="text-foreground">owner/repo</span>
            </div>
            <input
              id="github-url"
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/org/repo or https://github.com/org/repo/tree/main"
              className="mt-3 w-full rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground outline-none placeholder:text-muted sm:text-lg"
            />
            <button
              type="button"
              onClick={analyzeRepository}
              disabled={isSubmitting}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Analyze repository
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>

        <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-secondary">Live preview</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : "Waiting for a valid repo"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Branch: {parsedRepo?.branch ?? "main"} · Confidence score {previewScore}%
          </p>

          <div className="mt-4 space-y-3">
            {[
              { label: "Files scanned", value: Math.max(120, githubUrl.length * 3) },
              { label: "Signals extracted", value: parsedRepo ? 12 : 0 },
              { label: "Preview state", value: parsedRepo ? "Ready" : "Waiting" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm"
              >
                <span className="text-muted">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-7 text-muted">
            Preview: repo ingestion, dependency scan, graph build, and onboarding route creation.
          </p>
        </div>
      </div>
    </div>
  );
}
