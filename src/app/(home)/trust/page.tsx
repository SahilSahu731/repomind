import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  CloudOff,
  Eye,
  FileWarning,
  GitPullRequest,
  KeyRound,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Security",
  description:
    "How RepoMind handles repository access, source code, generated reports, credentials, and analysis boundaries.",
  alternates: { canonical: "/trust" },
};

const boundaries = [
  {
    icon: Eye,
    number: "01",
    title: "Read-only by design",
    description:
      "RepoMind inspects public repository content. It does not commit, push, open pull requests, or modify the source repository.",
  },
  {
    icon: Trash2,
    number: "02",
    title: "Temporary source copies",
    description:
      "A working copy is created only for analysis and removed when processing completes or fails. The generated report—not a permanent source mirror—is retained.",
  },
  {
    icon: KeyRound,
    number: "03",
    title: "Secrets stay server-side",
    description:
      "Service-role credentials, provider keys, and authentication secrets are restricted to the server runtime and never included in browser health responses.",
  },
];

const promises = [
  [GitPullRequest, "Repository changes", "Never written"],
  [CloudOff, "Private repositories", "Not supported today"],
  [LockKeyhole, "Stored passwords", "Hashed, never readable"],
  [ScanLine, "Generated analysis", "Evidence-led, review required"],
];

export default function TrustPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-[#292721] bg-[#1f1e1a] text-[#eee9de]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <div className="relative mx-auto grid min-h-[43rem] w-full max-w-[90rem] lg:grid-cols-[1.25fr_.75fr]">
          <header className="flex flex-col justify-between px-6 py-14 sm:px-10 sm:py-20 lg:border-r lg:border-white/20 lg:px-16 xl:px-20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#d97757]" />
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#d9d3c8]">
                Trust / Clear boundaries
              </p>
            </div>
            <h1 className="mt-24 max-w-[10ch] font-serif text-[clamp(4rem,8vw,8.5rem)] leading-[.82] tracking-[-.068em]">
              Know what enters. Know what stays.
            </h1>
          </header>

          <aside className="flex flex-col justify-between bg-[#d75c3f] p-7 text-white sm:p-11 lg:p-14">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-white/50">
              <CircleCheck className="h-7 w-7" />
            </div>
            <div className="mt-24">
              <p className="font-serif text-3xl leading-[1.12] tracking-[-.04em] sm:text-4xl">
                Useful analysis should not require vague promises about your code.
              </p>
              <p className="mt-7 text-sm leading-7 text-white/80">
                These are the operating boundaries of RepoMind today—not a list of hypothetical future controls.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="grid gap-12 lg:grid-cols-[.55fr_1.45fr]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
              01 / Analysis contract
            </p>
            <p className="mt-6 max-w-xs text-sm leading-7 text-[#5e5952]">
              A plain-language account of what happens from repository URL to finished report.
            </p>
          </div>

          <div className="divide-y divide-[#292721] border-y border-[#292721]">
            {boundaries.map(({ icon: Icon, number, title, description }) => (
              <article key={title} className="grid gap-6 py-9 sm:grid-cols-[4rem_1fr] sm:py-11">
                <div>
                  <span className="font-mono text-[9px] text-[#c94f34]">{number}</span>
                  <Icon className="mt-5 h-5 w-5 text-[#667a60]" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl tracking-[-.045em] sm:text-4xl">{title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e5952]">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#292721] bg-[#e8dfcf]">
        <div className="mx-auto w-full max-w-[90rem] px-6 py-16 sm:px-10 lg:px-16 lg:py-24 xl:px-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
                02 / At a glance
              </p>
              <h2 className="mt-5 font-serif text-5xl tracking-[-.055em] sm:text-7xl">The short version.</h2>
            </div>
            <FileWarning className="h-9 w-9 text-[#667a60]" />
          </div>

          <div className="mt-12 grid gap-px border border-[#292721] bg-[#292721] sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(([Icon, label, value]) => {
              const ItemIcon = Icon as typeof ShieldCheck;
              return (
                <article key={String(label)} className="bg-[#f7f2e7] p-7 sm:p-8">
                  <ItemIcon className="h-5 w-5 text-[#d75c3f]" />
                  <p className="mt-14 font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">
                    {String(label)}
                  </p>
                  <p className="mt-3 font-serif text-2xl tracking-[-.035em]">{String(value)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="grid gap-12 border-t border-[#292721] pt-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">03 / Your controls</p>
            <h2 className="mt-6 max-w-[14ch] font-serif text-5xl leading-[.94] tracking-[-.052em] sm:text-7xl">
              Your workspace should never feel like a black box.
            </h2>
          </div>
          <div>
            <p className="text-sm leading-7 text-[#5e5952]">
              Export workspace information from Settings, review retention details, or request correction and deletion through support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/data-controls" className="group inline-flex items-center gap-2 rounded-full bg-[#292721] px-5 py-3 text-sm font-semibold text-[#f5f0e5] transition hover:bg-[#d75c3f]">
                Data controls <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/privacy" className="inline-flex items-center rounded-full border border-[#292721] px-5 py-3 text-sm font-semibold transition hover:bg-[#e8dfcf]">
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
