import Link from "next/link";
import { ArrowRight, Bolt, CheckCircle2, Sparkles } from "lucide-react";
import { HeroIllustration } from "./HeroIllustration";
import { TrustStrip } from "./TrustStrip";

export function LandingHero() {
  return (
    <section id="features" className="relative overflow-hidden border-b border-border px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(34,211,238,0.06),transparent_40%),radial-gradient(circle_at_82%_0%,rgba(234,88,12,0.08),transparent_36%)]" />

      <div className="relative mx-auto max-w-280">
        <div className="reveal grid gap-10 lg:grid-cols-2 lg:items-center" style={{ animationDelay: "90ms" }}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Built For Engineering Leaders
            </div>

            <h1 className="mt-6 max-w-[48ch] text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-[3.6rem]">
              Turn any repo URL into architecture intelligence.
            </h1>

            <p className="mt-4 max-w-[62ch] text-base leading-7 text-muted sm:text-lg">
              RepoMind reads repository structure, dependency shape, and onboarding friction in minutes so platform, product, and engineering can align on what matters.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#try"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-background transition hover:opacity-95"
              >
                Analyze a repository
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#workflow"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-7 text-sm font-semibold text-foreground transition hover:bg-surface-2"
              >
                View workflow
              </Link>
            </div>

            <p className="mt-3 text-sm text-muted">No signup required for public repositories.</p>

            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Repo-to-Insight in Minutes",
                    body: "Start from one URL and surface the files, edges, and architecture signatures that shape delivery speed.",
                  },
                  {
                    title: "Team-Ready Context",
                    body: "Share common context across platform, product, and security before sprint planning starts.",
                  },
                  {
                    title: "Actionable Route Maps",
                    body: "Get practical first-steps for onboarding, refactoring, and risk reduction in one place.",
                  },
                ].map((item, index) => (
                  <article
                    key={item.title}
                    className="stagger-in rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_48px_-38px_rgba(0,0,0,0.7)]"
                    style={{ animationDelay: `${180 + index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                        {index === 0 && <CheckCircle2 className="h-4 w-4 text-secondary" />}
                        {index === 1 && <Bolt className="h-4 w-4 text-[#fda4af]" />}
                        {index === 2 && <ArrowRight className="h-4 w-4 text-[#fb7185]" />}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <TrustStrip />
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4">
              <HeroIllustration className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
