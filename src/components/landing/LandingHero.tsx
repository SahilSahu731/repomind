import Link from "next/link";
import { RepoAnalyzeBar } from "@/components/landing/RepoAnalyzeBar";

export function LandingHero() {
  return (
    <section className="grid gap-8 pb-24 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12 lg:pt-16">
      <div className="reveal" style={{ animationDelay: "80ms" }}>
        <p className="mb-5 inline-flex rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-xs font-medium tracking-[0.14em] text-muted uppercase">
          AI codebase intelligence
        </p>
        <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-[4.4rem]">
          Understand a repository before you read the code.
        </h1>
        <p className="mt-6 max-w-[58ch] text-base leading-8 text-muted sm:text-lg">
          RepoMind turns a GitHub repository into a beautiful preview, then
          sends you into the workspace with architecture, graph, onboarding,
          and risk signals already organized.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="#try"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-background transition hover:opacity-95"
          >
            Analyze a Repo
          </Link>
          <Link
            href="#workflow"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-[var(--surface)] px-7 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-2)]"
          >
            View workflow
          </Link>
        </div>

        <div className="mt-10 grid max-w-[40rem] gap-3 sm:grid-cols-3">
          {[
            ["< 60s", "first insights"],
            ["4 panels", "segmented results"],
            ["1 route", "workspace ready"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-3">
              <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
              <p className="text-xs uppercase tracking-[0.08em] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="reveal space-y-4" style={{ animationDelay: "170ms" }}>
        <RepoAnalyzeBar />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Architecture Lens", value: "24 modules" },
            { title: "Dependency Heat", value: "12 risks" },
            { title: "Onboarding Path", value: "9 steps" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-[var(--surface)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">{item.title}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
