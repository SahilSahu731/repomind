"use client";

import {
  Activity,
  Check,
  Clock3,
  Database,
  HardDrive,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  HealthApiResponse,
  HealthSnapshot,
  HealthState,
  ServiceHealthState,
} from "@/types/health";

const POLL_INTERVAL_MS = 30_000;

const stateCopy: Record<HealthState, { title: string; description: string }> = {
  operational: {
    title: "All checked systems are operational.",
    description: "RepoMind is ready to receive and process repository analysis requests.",
  },
  degraded: {
    title: "Systems are running with a fallback.",
    description: "Core requests are available, but one service is operating with reduced resilience.",
  },
  outage: {
    title: "A required system is unavailable.",
    description: "Some RepoMind requests may fail until the affected service recovers.",
  },
};

const stateStyles: Record<ServiceHealthState, string> = {
  operational: "bg-[#667a60] text-white",
  degraded: "bg-[#d9933d] text-[#292721]",
  outage: "bg-[#c94f34] text-white",
  disabled: "bg-[#8a847a] text-white",
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function StatusIcon({ state }: { state: ServiceHealthState }) {
  if (state === "operational") return <Check className="h-4 w-4" />;
  if (state === "outage") return <X className="h-4 w-4" />;
  return <TriangleAlert className="h-4 w-4" />;
}

export function StatusDashboard() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestFailed, setRequestFailed] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload = (await response.json()) as HealthApiResponse;
      if (!payload.data) throw new Error("Health response did not include a snapshot");
      setSnapshot(payload.data);
      setRequestFailed(false);
    } catch {
      setRequestFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const displayState: HealthState = requestFailed ? "outage" : snapshot?.status ?? "operational";
  const copy = stateCopy[displayState];

  return (
    <div className="mx-auto w-full max-w-[90rem] px-6 py-14 sm:px-10 sm:py-20 lg:px-16 xl:px-20">
      <section className="overflow-hidden border border-[#292721] bg-[#292721]">
        <div className="grid lg:grid-cols-[1.2fr_.8fr]">
          <div className="relative overflow-hidden bg-[#f7f2e7] p-7 sm:p-11 lg:p-14">
            <div aria-hidden className="marketing-grid absolute inset-0 opacity-60" />
            <div className="relative">
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
                System status / Live probe
              </p>
              <h1 className="mt-7 max-w-[9ch] font-serif text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.065em]">
                The pulse of RepoMind.
              </h1>
              <p className="mt-8 max-w-xl text-sm leading-7 text-[#5e5952] sm:text-base">
                A direct view of the services that store workspaces, process analysis jobs, and protect the API.
              </p>
            </div>
          </div>

          <div className="flex min-h-[28rem] flex-col justify-between bg-[#1f1e1a] p-7 text-[#eee9de] sm:p-11 lg:p-14">
            <div className="flex items-center justify-between">
              <span className={`grid h-12 w-12 place-items-center rounded-full ${stateStyles[displayState]}`}>
                <StatusIcon state={displayState} />
              </span>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold transition hover:border-white/60 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Check now
              </button>
            </div>
            <div className="mt-16">
              <p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#918c83]">Current condition</p>
              <h2 className="mt-4 max-w-md font-serif text-4xl leading-[1.02] tracking-[-.045em] sm:text-5xl">
                {isLoading && !snapshot ? "Checking every connection…" : copy.title}
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#bdb7ac]">
                {requestFailed
                  ? "The browser could not reach the health endpoint. The API or network may be unavailable."
                  : copy.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 border border-[#292721] bg-[#f7f2e7]">
        <div className="flex flex-col gap-4 border-b border-[#292721] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">Service checks</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-.045em]">Measured, not assumed.</h2>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#6d675f]">
            Auto-refresh · 30 seconds
          </p>
        </div>

        <div className="divide-y divide-[#292721]">
          {snapshot?.services.map((service, index) => (
            <article key={service.name} className="grid gap-5 p-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:p-8">
              <span className="font-mono text-[9px] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-2xl tracking-[-.035em] sm:text-3xl">{service.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.12em] ${stateStyles[service.state]}`}>
                    <StatusIcon state={service.state} /> {service.state}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5e5952]">{service.detail}</p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#6d675f]">
                {service.latencyMs === null ? "Local" : `${service.latencyMs} ms`}
              </p>
            </article>
          )) ?? (
            <div className="p-8 text-sm text-[#5e5952]">Waiting for the first health snapshot…</div>
          )}
        </div>
      </section>

      {snapshot ? (
        <section className="mt-10 grid gap-px border border-[#292721] bg-[#292721] sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Database, "Storage", snapshot.runtime.storage === "local-file" ? "Local file" : "Supabase"],
            [ServerCog, "Analysis", snapshot.runtime.analysis === "inline" ? "Inline" : "BullMQ"],
            [ShieldCheck, "Rate limits", snapshot.runtime.rateLimit === "memory" ? "In memory" : "Upstash"],
            [Clock3, "Process uptime", formatUptime(snapshot.uptimeSeconds)],
          ].map(([Icon, label, value]) => {
            const ItemIcon = Icon as typeof Activity;
            return (
              <article key={String(label)} className="bg-[#e8dfcf] p-6 sm:p-8">
                <ItemIcon className="h-5 w-5 text-[#667a60]" />
                <p className="mt-8 font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">{String(label)}</p>
                <p className="mt-2 font-serif text-2xl tracking-[-.035em]">{String(value)}</p>
              </article>
            );
          })}
        </section>
      ) : null}

      <div className="mt-7 flex flex-col gap-2 text-xs leading-5 text-[#6d675f] sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2"><HardDrive className="h-3.5 w-3.5" /> No credentials or connection strings are exposed.</p>
        <p>
          {snapshot ? `Last checked ${new Date(snapshot.timestamp).toLocaleString()}` : "Awaiting live data"}
        </p>
      </div>
    </div>
  );
}
