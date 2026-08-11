"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CircleCheckBig,
  Clock3,
  FileCode2,
  GitBranch,
  Github,
  Loader2,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { useAccountOverview } from "@/components/profile/useAccountOverview";
import type { AccountActivityItem } from "@/types/account";

type ActivityFilter = "all" | "complete" | "active" | "failed";

const ACTIVE_STATUSES = new Set(["QUEUED", "CLONING", "PARSING", "ANALYZING"]);
const FILTERS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "complete", label: "Reports ready" },
  { value: "active", label: "In progress" },
  { value: "failed", label: "Needs attention" },
];

function matchesFilter(item: AccountActivityItem, filter: ActivityFilter): boolean {
  if (filter === "complete") return item.status === "COMPLETE";
  if (filter === "failed") return item.status === "FAILED";
  if (filter === "active") return ACTIVE_STATUSES.has(item.status);
  return true;
}

function formatMoment(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "Date unavailable", time: "" };
  return {
    date: new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function statusContent(item: AccountActivityItem) {
  if (item.status === "COMPLETE") {
    return {
      eyebrow: "Report ready",
      title: `Mapped ${item.owner}/${item.name}`,
      description: "Architecture, dependency, entry-point, and onboarding artifacts were generated.",
      icon: CircleCheckBig,
      tone: "text-[#43533f] border-[#667a60] bg-[#dfe5d8]",
    };
  }
  if (item.status === "FAILED") {
    return {
      eyebrow: "Needs attention",
      title: `Analysis stopped for ${item.owner}/${item.name}`,
      description: "The run ended before a complete repository report could be produced.",
      icon: AlertTriangle,
      tone: "text-[#82331f] border-[#a33f2b] bg-[#ead8cf]",
    };
  }

  const step = (item.currentStep ?? item.status).toLowerCase().replaceAll("_", " ");
  return {
    eyebrow: "Analysis moving",
    title: `Inspecting ${item.owner}/${item.name}`,
    description: `${step} is underway. The job is ${item.progress}% complete.`,
    icon: RotateCw,
    tone: "text-[#8c3826] border-[#d75c3f] bg-[#f0d9cf]",
  };
}

function ActivityLoading() {
  return (
    <div role="status" aria-label="Loading account activity" className="space-y-8 py-3">
      <div className="h-64 animate-pulse border border-[#292721]/25 bg-[#e8dfcf]/65" />
      <div className="grid gap-px border border-[#292721]/20 bg-[#292721]/20 lg:grid-cols-[1.2fr_.8fr]">
        <div className="h-[32rem] animate-pulse bg-[#f7f2e7]/75" />
        <div className="h-[32rem] animate-pulse bg-[#e8dfcf]/75" />
      </div>
      <span className="sr-only">Loading your real repository timeline</span>
    </div>
  );
}

export default function UserActivityPage() {
  const { overview, isLoading, isRefreshing, error, reload } = useAccountOverview();
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const visibleActivity = useMemo(
    () => overview?.activity.filter((item) => matchesFilter(item, filter)) ?? [],
    [filter, overview?.activity]
  );

  if (isLoading) return <ActivityLoading />;

  if (error || !overview) {
    return (
      <section className="border border-[#a33f2b] bg-[#ead8cf] p-6 sm:p-8">
        <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#82331f]">Activity unavailable</p>
        <h2 className="mt-3 font-serif text-4xl tracking-[-.05em]">The workspace timeline could not be loaded.</h2>
        <p className="mt-3 text-sm text-[#6d4a42]">{error ?? "Please try again."}</p>
        <button type="button" onClick={() => void reload()} className="mt-6 inline-flex h-11 items-center gap-2 bg-[#292721] px-5 text-xs font-medium text-[#f7f2e7]">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </section>
    );
  }

  const { summary, activity } = overview;

  return (
    <div className="space-y-9 py-2">
      <section className="grid border border-[#292721] bg-[#292721] lg:grid-cols-[1.25fr_.75fr]">
        <div className="bg-[#f7f2e7] p-6 sm:p-9 lg:p-10">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">Workspace journal / Live record</p>
            {isRefreshing ? <Loader2 aria-label="Refreshing activity" className="h-3 w-3 animate-spin text-[#d75c3f]" /> : null}
          </div>
          <h2 className="mt-6 max-w-[12ch] font-serif text-[clamp(3.8rem,7.5vw,7.5rem)] font-normal leading-[.82] tracking-[-.065em]">
            Every system leaves a trail.
          </h2>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-[#5e5952] sm:text-base">
            A factual timeline of submitted repositories, completed reports, active processing, and runs that need another look.
          </p>
        </div>

        <aside className="grid grid-cols-2 bg-[#e8dfcf]">
          {[
            ["All runs", summary.totalRepositories],
            ["Reports ready", summary.reportsReady],
            ["Processing", summary.inProgress],
            ["Needs review", summary.needsAttention],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex min-h-32 flex-col justify-between border-b border-r border-[#292721] p-5 sm:min-h-40 sm:p-6">
              <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">{String(label)}</p>
              <p className="font-serif text-5xl tracking-[-.06em]">{String(value).padStart(2, "0")}</p>
            </div>
          ))}
        </aside>
      </section>

      <section>
        <div className="flex flex-col gap-4 border-b border-[#292721] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">Chronological index</p>
            <h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Repository activity</h3>
          </div>
          <p className="text-xs text-[#6d675f]">{activity.length} recorded {activity.length === 1 ? "event" : "events"}</p>
        </div>

        <div aria-label="Filter account activity" className="flex overflow-x-auto border-b border-[#292721]/30 py-3">
          {FILTERS.map((item) => {
            const count = activity.filter((event) => matchesFilter(event, item.value)).length;
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(item.value)}
                className={`flex shrink-0 items-center gap-2 border-r border-[#292721]/25 px-4 py-1.5 text-xs transition first:pl-0 ${isActive ? "font-semibold text-[#292721]" : "text-[#6d675f] hover:text-[#292721]"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#d75c3f]" : "bg-[#aaa292]"}`} />
                {item.label}
                <span className="font-mono text-[8px] text-[#8a8378]">{String(count).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1.22fr_.78fr]">
        <article className="bg-[#f7f2e7] p-5 sm:p-8">
          {visibleActivity.length > 0 ? (
            <ol className="relative">
              <span aria-hidden className="absolute bottom-5 left-[1.15rem] top-5 w-px bg-[#292721]/30" />
              {visibleActivity.map((item, index) => {
                const content = statusContent(item);
                const Icon = content.icon;
                const moment = formatMoment(item.occurredAt);
                const href = `/user/dashboard?repoId=${encodeURIComponent(item.repoId)}&repo=${encodeURIComponent(`${item.owner}/${item.name}`)}`;

                return (
                  <li key={item.id} className="relative grid grid-cols-[2.35rem_1fr] gap-4 pb-8 last:pb-0">
                    <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border ${content.tone}`}>
                      <Icon className={`h-3.5 w-3.5 ${ACTIVE_STATUSES.has(item.status) ? "motion-safe:animate-spin" : ""}`} />
                    </span>
                    <div className="border-b border-[#292721]/25 pb-7 last:border-b-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#c94f34]">{String(index + 1).padStart(2, "0")} / {content.eyebrow}</p>
                          <h4 className="mt-2 font-serif text-3xl tracking-[-.045em]">{content.title}</h4>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs font-medium">{moment.date}</p>
                          <p className="mt-1 font-mono text-[8px] uppercase tracking-[.1em] text-[#777168]">{moment.time}</p>
                        </div>
                      </div>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e5952]">{content.description}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[.1em] text-[#6d675f]">
                        <span className="flex items-center gap-1.5"><Github className="h-3 w-3" />{item.owner}/{item.name}</span>
                        <span className="flex items-center gap-1.5"><GitBranch className="h-3 w-3" />{item.branch === "HEAD" ? "Default branch" : item.branch}</span>
                        {item.status !== "COMPLETE" && item.status !== "FAILED" ? <span>{item.progress}% complete</span> : null}
                      </div>

                      <Link href={href} className="group mt-4 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
                        {item.status === "COMPLETE" ? "Open report" : item.status === "FAILED" ? "Review run" : "View progress"}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Clock3 className="mx-auto h-6 w-6 text-[#6d675f]" />
                <h4 className="mt-4 font-serif text-3xl tracking-[-.045em]">Nothing in this view yet.</h4>
                <p className="mt-2 text-sm text-[#6d675f]">Choose another filter or start a repository analysis.</p>
                <button type="button" onClick={() => setFilter("all")} className="mt-5 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">Show all activity</button>
              </div>
            </div>
          )}
        </article>

        <aside className="bg-[#e8dfcf] p-5 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">Workspace signals</p>
          <h3 className="mt-3 font-serif text-4xl tracking-[-.05em]">What the trail says.</h3>

          <dl className="mt-8 divide-y divide-[#292721]/25 border-y border-[#292721]">
            <div className="py-5">
              <dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Completion rate</dt>
              <dd className="mt-2 flex items-end justify-between gap-4">
                <span className="font-serif text-5xl tracking-[-.06em]">{summary.completionRate}%</span>
                <CircleCheckBig className="mb-2 h-4 w-4 text-[#667a60]" />
              </dd>
              <div className="mt-3 h-1.5 bg-[#cfc3af]"><div className="h-full bg-[#667a60]" style={{ width: `${summary.completionRate}%` }} /></div>
            </div>
            <div className="flex items-end justify-between gap-4 py-5">
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Primary language</dt>
                <dd className="mt-2 font-serif text-3xl tracking-[-.04em]">{summary.topLanguage ?? "Not detected"}</dd>
              </div>
              <FileCode2 className="mb-1 h-4 w-4 text-[#6d675f]" />
            </div>
            <div className="flex items-end justify-between gap-4 py-5">
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Active days / 30</dt>
                <dd className="mt-2 font-serif text-3xl tracking-[-.04em]">{summary.activeDays}</dd>
              </div>
              <Clock3 className="mb-1 h-4 w-4 text-[#6d675f]" />
            </div>
            <div className="flex items-end justify-between gap-4 py-5">
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Code indexed</dt>
                <dd className="mt-2 font-serif text-3xl tracking-[-.04em]">{new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(summary.totalLines)} lines</dd>
              </div>
              <FileCode2 className="mb-1 h-4 w-4 text-[#6d675f]" />
            </div>
          </dl>

          <Link href="/user/dashboard" className="group mt-7 flex h-12 items-center justify-center gap-2 bg-[#292721] px-5 text-xs font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f]">
            Analyze another repository
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </aside>
      </section>
    </div>
  );
}
