"use client";

import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  CircleCheckBig,
  Clock3,
  Code2,
  ExternalLink,
  FileCode2,
  Github,
  Layers3,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useAccountOverview } from "@/components/profile/useAccountOverview";
import type { AccountActivityItem, AccountOverview } from "@/types/account";

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Recently";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

function activityCopy(activity: AccountActivityItem) {
  if (activity.status === "COMPLETE") {
    return { label: "Report completed", detail: "Architecture map and onboarding report are ready." };
  }
  if (activity.status === "FAILED") {
    return { label: "Analysis needs attention", detail: "The repository stopped before a report was produced." };
  }

  const step = (activity.currentStep ?? activity.status)
    .toLowerCase()
    .replaceAll("_", " ");
  return { label: "Analysis in progress", detail: `${step} · ${activity.progress}% complete` };
}

function ProfileLoading() {
  return (
    <div role="status" aria-label="Loading profile" className="space-y-8 py-3">
      <div className="grid min-h-72 animate-pulse border border-[#292721]/25 bg-[#e8dfcf]/60 lg:grid-cols-[1.15fr_.85fr]">
        <div className="border-b border-[#292721]/20 p-8 lg:border-b-0 lg:border-r" />
        <div className="p-8" />
      </div>
      <div className="grid border-l border-t border-[#292721]/20 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-32 border-b border-r border-[#292721]/20 bg-[#f7f2e7]/70" />)}
      </div>
      <span className="sr-only">Loading your account overview</span>
    </div>
  );
}

function ProfileContent({ overview }: { overview: AccountOverview }) {
  const { user, summary, languages, repositories, activity } = overview;
  const name = user.name?.trim() || user.githubUsername || "RepoMind member";
  const initial = name.charAt(0).toUpperCase();
  const completenessSignals = [user.name, user.email, user.githubUsername, user.image];
  const profileCompleteness = Math.round(
    (completenessSignals.filter(Boolean).length / completenessSignals.length) * 100
  );
  const recentActivity = activity.slice(0, 5);
  const recentRepositories = repositories.slice(0, 4);

  return (
    <div className="space-y-10 py-2">
      <section className="grid border border-[#292721] bg-[#292721] lg:grid-cols-[1.15fr_.85fr]">
        <div className="bg-[#f7f2e7] p-6 sm:p-9 lg:p-10">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
            Personal dossier / Workspace owner
          </p>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-24 w-24 shrink-0 rounded-full border border-[#292721] object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[#292721] bg-[#d75c3f] font-serif text-5xl text-white sm:h-28 sm:w-28">
                {initial}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="max-w-[12ch] font-serif text-[clamp(3.4rem,7vw,7rem)] font-normal leading-[.82] tracking-[-.065em] text-[#292721]">
                {name}
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5e5952]">
                {user.email ? <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{user.email}</span> : null}
                {user.githubUsername ? <span className="flex items-center gap-2"><Github className="h-3.5 w-3.5" />@{user.githubUsername}</span> : null}
              </div>
            </div>
          </div>

          <p className="mt-8 max-w-2xl border-t border-[#292721]/30 pt-5 text-sm leading-7 text-[#5e5952] sm:text-base">
            A living record of the systems you have inspected, the technologies inside them, and the reports ready for your next contribution.
          </p>
        </div>

        <aside className="flex flex-col bg-[#e8dfcf] p-6 sm:p-9 lg:p-10">
          <div className="flex items-start justify-between gap-4 border-b border-[#292721] pb-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f]">Account signal</p>
              <p className="mt-2 font-serif text-3xl tracking-[-.045em]">{user.plan} workspace</p>
            </div>
            <BadgeCheck className="h-6 w-6 text-[#667a60]" />
          </div>

          <dl className="divide-y divide-[#292721]/25">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Workspace role</dt>
              <dd className="text-sm font-medium">Owner</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Sign-in method</dt>
              <dd className="text-sm font-medium">{user.githubUsername ? "GitHub" : "Email"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Analysis access</dt>
              <dd className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-3.5 w-3.5 text-[#667a60]" />Read-only</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Credits remaining</dt>
              <dd className="font-serif text-2xl">{user.creditsRemaining}</dd>
            </div>
          </dl>

          <div className="mt-auto border-t border-[#292721] pt-5">
            <div className="flex items-center justify-between text-xs text-[#6d675f]">
              <span>Profile completeness</span>
              <span className="font-semibold text-[#292721]">{profileCompleteness}%</span>
            </div>
            <div className="mt-3 h-1.5 bg-[#cfc3af]">
              <div className="h-full bg-[#d75c3f]" style={{ width: `${profileCompleteness}%` }} />
            </div>
          </div>
        </aside>
      </section>

      <section aria-label="Workspace totals" className="grid border-l border-t border-[#292721] sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Repositories", summary.totalRepositories, Layers3],
          ["Reports ready", summary.reportsReady, CircleCheckBig],
          ["Files mapped", compactNumber(summary.totalFiles), FileCode2],
          ["Lines indexed", compactNumber(summary.totalLines), Code2],
          ["Active days / 30", summary.activeDays, Clock3],
        ].map(([label, value, Icon]) => {
          const MetricIcon = Icon as typeof Layers3;
          return (
            <div key={String(label)} className="border-b border-r border-[#292721] bg-[#f7f2e7]/65 p-5">
              <div className="flex items-center justify-between text-[#6d675f]">
                <p className="font-mono text-[8px] uppercase tracking-[.14em]">{String(label)}</p>
                <MetricIcon className="h-4 w-4" />
              </div>
              <p className="mt-6 font-serif text-4xl tracking-[-.05em] text-[#292721]">{String(value)}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[.82fr_1.18fr]">
        <article className="bg-[#e8dfcf] p-6 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">01 / Identity</p>
          <h3 className="mt-3 font-serif text-4xl tracking-[-.05em]">Working identity</h3>

          <dl className="mt-7 divide-y divide-[#292721]/25 border-y border-[#292721]">
            <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Display name</dt>
              <dd className="text-sm font-medium">{user.name || "Not provided"}</dd>
            </div>
            <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Email</dt>
              <dd className="break-all text-sm font-medium">{user.email || "Not provided"}</dd>
            </div>
            <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">GitHub</dt>
              <dd className="text-sm font-medium">{user.githubUsername ? `@${user.githubUsername}` : "Not connected"}</dd>
            </div>
            <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Account ID</dt>
              <dd className="truncate font-mono text-[10px] text-[#5e5952]">{user.id}</dd>
            </div>
          </dl>

          {user.githubUsername ? (
            <a
              href={`https://github.com/${encodeURIComponent(user.githubUsername)}`}
              target="_blank"
              rel="noreferrer"
              className="group mt-6 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4"
            >
              View GitHub profile
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ) : null}
        </article>

        <article className="bg-[#f7f2e7] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">02 / Code footprint</p>
              <h3 className="mt-3 font-serif text-4xl tracking-[-.05em]">Languages encountered</h3>
            </div>
            <p className="hidden text-right font-mono text-[8px] uppercase tracking-[.12em] text-[#6d675f] sm:block">
              {summary.uniqueOwners} GitHub {summary.uniqueOwners === 1 ? "owner" : "owners"}
            </p>
          </div>

          {languages.length > 0 ? (
            <div className="mt-8 space-y-5">
              {languages.map((language, index) => (
                <div key={language.name}>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[8px] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-medium">{language.name}</span>
                    </div>
                    <span className="font-mono text-[9px] text-[#6d675f]">{language.count} repos / {language.percentage}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-[#ded4c2]">
                    <div className="h-full bg-[#667a60]" style={{ width: `${Math.max(4, language.percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 border-y border-[#292721]/30 py-10 text-sm text-[#6d675f]">
              Language signals will appear after your first completed repository analysis.
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 border-l border-t border-[#292721]/30 sm:grid-cols-4">
            {[
              ["Top language", summary.topLanguage ?? "—"],
              ["Completion", `${summary.completionRate}%`],
              ["Processing", summary.inProgress],
              ["Needs review", summary.needsAttention],
            ].map(([label, value]) => (
              <div key={String(label)} className="border-b border-r border-[#292721]/30 p-3">
                <p className="font-mono text-[7px] uppercase tracking-[.12em] text-[#6d675f]">{String(label)}</p>
                <p className="mt-2 truncate text-sm font-semibold">{String(value)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <article>
          <div className="flex items-end justify-between gap-4 border-b border-[#292721] pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">03 / Recent movement</p>
              <h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Activity trail</h3>
            </div>
            <Link href="/user/activity" className="group flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
              Full activity <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <ol className="divide-y divide-[#292721]/25">
              {recentActivity.map((item, index) => {
                const copy = activityCopy(item);
                return (
                  <li key={item.id} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-4">
                    <span className="pt-0.5 font-mono text-[8px] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{copy.label}</p>
                      <p className="mt-1 truncate text-xs text-[#5e5952]">{item.owner}/{item.name} · {item.branch === "HEAD" ? "default branch" : item.branch}</p>
                      <p className="mt-1 text-xs leading-5 text-[#777168]">{copy.detail}</p>
                    </div>
                    <span className="whitespace-nowrap pt-0.5 font-mono text-[8px] uppercase tracking-[.1em] text-[#777168]">{relativeTime(item.occurredAt)}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border-b border-[#292721]/25 py-10 text-sm text-[#6d675f]">No repository activity yet.</p>
          )}
        </article>

        <article>
          <div className="flex items-end justify-between gap-4 border-b border-[#292721] pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">04 / Repository shelf</p>
              <h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Recently inspected</h3>
            </div>
            <Link href="/user/dashboard" className="group flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
              All repositories <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {recentRepositories.length > 0 ? (
            <div className="divide-y divide-[#292721]/25">
              {recentRepositories.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/user/dashboard?repoId=${encodeURIComponent(repo.id)}&repo=${encodeURIComponent(`${repo.owner}/${repo.name}`)}`}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4"
                >
                  <span className="grid h-10 w-10 place-items-center border border-[#292721]/35 bg-[#e8dfcf]">
                    <Github className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-2xl tracking-[-.035em]">{repo.name}</p>
                    <p className="mt-1 truncate font-mono text-[8px] uppercase tracking-[.12em] text-[#6d675f]">{repo.owner} / {repo.branch === "HEAD" ? "default" : repo.branch}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{repo.status === "COMPLETE" ? "Ready" : repo.status === "FAILED" ? "Review" : `${repo.latestJob?.progress ?? 0}%`}</p>
                    <p className="mt-1 font-mono text-[7px] uppercase tracking-[.1em] text-[#777168]">{formatDate(repo.analyzedAt ?? repo.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-b border-[#292721]/25 py-10">
              <p className="text-sm text-[#6d675f]">Your repository shelf is empty.</p>
              <Link href="/user/dashboard" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
                Analyze your first repository <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </article>
      </section>

      <footer className="flex flex-col gap-4 border-t border-[#292721] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">
          <AtSign className="h-3.5 w-3.5" /> Account data refreshed {relativeTime(overview.generatedAt)}
        </p>
        <p className="flex items-center gap-2 text-xs text-[#6d675f]"><ShieldCheck className="h-3.5 w-3.5 text-[#667a60]" /> Repository analysis remains read-only.</p>
      </footer>
    </div>
  );
}

export default function UserProfilePage() {
  const { overview, isLoading, isRefreshing, error, reload } = useAccountOverview();

  if (isLoading) return <ProfileLoading />;

  if (error || !overview) {
    return (
      <section className="border border-[#a33f2b] bg-[#ead8cf] p-6 sm:p-8">
        <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#82331f]">Profile unavailable</p>
        <h2 className="mt-3 font-serif text-4xl tracking-[-.05em]">Your account overview could not be assembled.</h2>
        <p className="mt-3 text-sm text-[#6d4a42]">{error ?? "Please try again."}</p>
        <button type="button" onClick={() => void reload()} className="mt-6 inline-flex h-11 items-center gap-2 bg-[#292721] px-5 text-xs font-medium text-[#f7f2e7]">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </section>
    );
  }

  return (
    <div className="relative">
      {isRefreshing ? (
        <span className="absolute right-0 top-0 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#6d675f]">
          <Loader2 className="h-3 w-3 animate-spin" /> Syncing activity
        </span>
      ) : null}
      <ProfileContent overview={overview} />
    </div>
  );
}
