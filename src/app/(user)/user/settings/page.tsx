"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheckBig,
  Download,
  Eye,
  FileJson,
  Gauge,
  Github,
  Loader2,
  LogOut,
  Network,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import {
  DEFAULT_WORKSPACE_PREFERENCES,
  resetWorkspacePreferences,
  useWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/workspacePreferences";

function PreferenceToggle({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[#292721]/25 py-5 last:border-b-0">
      <div>
        <p className="text-sm font-semibold text-[#292721]">{label}</p>
        <p className="mt-1 max-w-lg text-xs leading-5 text-[#6d675f]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border border-[#292721] transition-colors ${checked ? "bg-[#667a60]" : "bg-[#d6ccba]"}`}
      >
        <span className={`absolute left-0 top-1 h-[1.1rem] w-[1.1rem] rounded-full border border-[#292721] bg-[#f7f2e7] transition-transform ${checked ? "translate-x-[1.55rem]" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  label,
  description,
  value,
  choices,
  onChange,
}: {
  label: string;
  description: string;
  value: T;
  choices: Array<{ value: T; label: string; detail: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="border-b border-[#292721]/25 py-5 last:border-b-0">
      <legend className="text-sm font-semibold text-[#292721]">{label}</legend>
      <p className="mt-1 text-xs leading-5 text-[#6d675f]">{description}</p>
      <div className="mt-4 grid gap-px bg-[#292721] sm:grid-cols-2">
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(choice.value)}
              className={`flex min-h-20 items-start gap-3 p-4 text-left transition ${selected ? "bg-[#292721] text-[#f5f0e5]" : "bg-[#f7f2e7] text-[#292721] hover:bg-[#e8dfcf]"}`}
            >
              <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? "border-[#e89980] bg-[#d75c3f]" : "border-[#8a8378]"}`}>
                {selected ? <Check className="h-2.5 w-2.5 text-white" /> : null}
              </span>
              <span>
                <span className="block text-xs font-semibold">{choice.label}</span>
                <span className={`mt-1 block text-[10px] leading-4 ${selected ? "text-[#bdb6aa]" : "text-[#6d675f]"}`}>{choice.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function UserSettingsPage() {
  const user = useUserStore((state) => state.user);
  const { preferences, updatePreferences, isLoaded } = useWorkspacePreferences();
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function update(updates: Partial<WorkspacePreferences>) {
    updatePreferences(updates);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1600);
  }

  function resetPreferences() {
    resetWorkspacePreferences();
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1600);
  }

  async function exportWorkspace() {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch("/api/user/overview", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error("Workspace export could not be prepared.");

      const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `repomind-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Workspace export could not be prepared.");
    } finally {
      setIsExporting(false);
    }
  }

  const changedPreferenceCount = Object.entries(preferences).filter(
    ([key, value]) => DEFAULT_WORKSPACE_PREFERENCES[key as keyof WorkspacePreferences] !== value
  ).length;

  return (
    <div className="space-y-10 py-2">
      <section className="grid border border-[#292721] bg-[#292721] lg:grid-cols-[1.18fr_.82fr]">
        <div className="bg-[#f7f2e7] p-6 sm:p-9 lg:p-10">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">Workspace controls / This browser</p>
            {saveState === "saved" ? <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.12em] text-[#667a60]"><Check className="h-3 w-3" />Saved</span> : null}
          </div>
          <h2 className="mt-6 max-w-[10ch] font-serif text-[clamp(3.8rem,7.2vw,7.2rem)] font-normal leading-[.82] tracking-[-.065em] text-[#292721]">
            Set the way you inspect.
          </h2>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-[#5e5952] sm:text-base">
            Shape report density, live updates, and interface behavior without changing the repository or the analysis itself.
          </p>
        </div>

        <aside className="flex flex-col bg-[#e8dfcf] p-6 sm:p-9 lg:p-10">
          <div className="flex items-start justify-between gap-4 border-b border-[#292721] pb-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f]">Preference status</p>
              <p className="mt-2 font-serif text-3xl tracking-[-.045em]">{changedPreferenceCount ? `${changedPreferenceCount} personalized` : "RepoMind defaults"}</p>
            </div>
            <Gauge className="h-6 w-6 text-[#667a60]" />
          </div>
          <dl className="divide-y divide-[#292721]/25">
            <div className="flex items-center justify-between gap-4 py-4"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Plan</dt><dd className="text-sm font-semibold">{user?.plan ?? "—"}</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Credits</dt><dd className="font-serif text-2xl">{user?.creditsRemaining ?? "—"}</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Storage</dt><dd className="text-sm font-semibold">Local preferences</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Analysis access</dt><dd className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-3.5 w-3.5 text-[#667a60]" />Read-only</dd></div>
          </dl>
          <p className="mt-auto border-t border-[#292721] pt-5 text-xs leading-5 text-[#6d675f]">Preferences are saved automatically in this browser and never alter generated repository data.</p>
        </aside>
      </section>

      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[.7fr_1.3fr]">
        <div className="bg-[#292721] p-6 text-[#f5f0e5] sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#e89980]">01 / Analysis experience</p>
          <h3 className="mt-4 max-w-[9ch] font-serif text-4xl leading-[.98] tracking-[-.05em]">Decide how much of the system you see.</h3>
          <Network className="mt-10 h-7 w-7 text-[#9aaa91]" />
        </div>
        <div className="bg-[#f7f2e7] px-6 sm:px-8">
          <PreferenceToggle
            checked={preferences.autoRefresh}
            label="Refresh active analyses automatically"
            description="Poll in-progress repositories every few seconds so status and completed reports appear without a manual reload."
            onChange={(autoRefresh) => update({ autoRefresh })}
          />
          <ChoiceGroup
            label="Dependency graph density"
            description="Controls how many high-connectivity files appear in the interactive dependency explorer."
            value={preferences.graphDensity}
            onChange={(graphDensity) => update({ graphDensity })}
            choices={[
              { value: "focused", label: "Focused", detail: "Show the eight strongest hotspots for faster orientation." },
              { value: "expanded", label: "Expanded", detail: "Show up to twelve hotspots and more relationship context." },
            ]}
          />
          <ChoiceGroup
            label="File intelligence detail"
            description="Sets the initial number of searchable file summaries shown inside completed reports."
            value={preferences.reportDetail}
            onChange={(reportDetail) => update({ reportDetail })}
            choices={[
              { value: "concise", label: "Concise", detail: "Begin with eight file summaries and expand when needed." },
              { value: "detailed", label: "Detailed", detail: "Begin with fourteen summaries for deeper review." },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <article>
          <div className="flex items-center justify-between border-b border-[#292721] pb-4">
            <div><p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">02 / Interface</p><h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Reading comfort</h3></div>
            <Sparkles className="h-5 w-5 text-[#d75c3f]" />
          </div>
          <PreferenceToggle
            checked={preferences.reduceMotion}
            label="Reduce interface motion"
            description="Minimize decorative animation and transitions throughout RepoMind. System-level reduced-motion preferences remain respected automatically."
            onChange={(reduceMotion) => update({ reduceMotion })}
          />
          <button type="button" onClick={resetPreferences} disabled={!isLoaded} className="group mt-5 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4 disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-45" /> Restore RepoMind defaults
          </button>
        </article>

        <article>
          <div className="flex items-center justify-between border-b border-[#292721] pb-4">
            <div><p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">03 / Data boundaries</p><h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">What stays under your control</h3></div>
            <ShieldCheck className="h-5 w-5 text-[#667a60]" />
          </div>
          <div className="divide-y divide-[#292721]/25">
            {[
              [Eye, "Read-only repository access", "RepoMind does not commit, push, or request repository write access."],
              [FileJson, "Portable workspace record", "Download your account overview, repository index, and activity as JSON."],
              [RefreshCw, "Snapshot-based reports", "Reports describe the analyzed repository snapshot and may differ from newer commits."],
            ].map(([Icon, title, body]) => {
              const RowIcon = Icon as typeof Eye;
              return <div key={String(title)} className="grid grid-cols-[2rem_1fr] gap-3 py-4"><RowIcon className="mt-0.5 h-4 w-4 text-[#667a60]" /><div><p className="text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-[#6d675f]">{String(body)}</p></div></div>;
            })}
          </div>
          <button type="button" onClick={() => void exportWorkspace()} disabled={isExporting} className="mt-5 inline-flex h-11 items-center gap-2 border border-[#292721] bg-[#292721] px-5 text-xs font-semibold text-[#f5f0e5] transition hover:bg-[#d75c3f] disabled:opacity-60">
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isExporting ? "Preparing export" : "Download workspace data"}
          </button>
          {exportError ? <p role="alert" className="mt-3 border-l-2 border-[#a33f2b] pl-3 text-xs text-[#82331f]">{exportError}</p> : null}
        </article>
      </section>

      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[1fr_1fr]">
        <article className="bg-[#e8dfcf] p-6 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">04 / Account</p>
          <h3 className="mt-3 font-serif text-4xl tracking-[-.05em]">Identity and access</h3>
          <dl className="mt-7 divide-y divide-[#292721]/25 border-y border-[#292721]">
            <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Email</dt><dd className="break-all text-sm font-semibold">{user?.email ?? "Loading account"}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">GitHub</dt><dd className="flex items-center gap-2 text-sm font-semibold"><Github className="h-3.5 w-3.5" />{user?.githubUsername ? `@${user.githubUsername}` : "Not connected"}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]"><dt className="font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Session</dt><dd className="flex items-center gap-2 text-sm font-semibold"><CircleCheckBig className="h-3.5 w-3.5 text-[#667a60]" />Active on this device</dd></div>
          </dl>
          <Link href="/user/profile" className="group mt-5 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">View complete profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Link>
        </article>

        <article className="flex flex-col bg-[#f7f2e7] p-6 sm:p-8">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">05 / Current session</p>
          <h3 className="mt-3 font-serif text-4xl tracking-[-.05em]">Leave this workspace safely.</h3>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#5e5952]">Signing out removes the current browser session. Your repository reports and workspace activity remain attached to your account.</p>
          <button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="mt-auto inline-flex h-11 w-fit items-center gap-2 border border-[#292721] px-5 text-xs font-semibold transition hover:bg-[#292721] hover:text-[#f5f0e5]">
            <LogOut className="h-3.5 w-3.5" /> Sign out on this device
          </button>
        </article>
      </section>
    </div>
  );
}
