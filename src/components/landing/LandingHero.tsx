import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { RepoAnalyzeBar } from "@/components/landing/RepoAnalyzeBar";

export function LandingHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1120px] flex-col justify-center px-6 pb-20 pt-10 sm:px-10 lg:px-16 lg:pt-16">
        <div className="reveal max-w-4xl space-y-7" style={{ animationDelay: "80ms" }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            Start with a GitHub repo
          </div>

          <div className="space-y-5">
            <h1 className="max-w-[12ch] text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-[5.25rem]">
              See the codebase before you read the code.
            </h1>
            <p className="max-w-[56ch] text-base leading-8 text-muted sm:text-lg">
              Drop in a repository URL and get a clean workspace preview for architecture, risk, onboarding, and dependency discovery.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="#try"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-background transition hover:opacity-95"
            >
              Start analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#flow"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-7 text-sm font-semibold text-foreground transition hover:bg-surface-2"
            >
              See the flow
            </Link>
          </div>

          <div className="mt-10 max-w-5xl">
            <RepoAnalyzeBar />
          </div>

          <div className="mt-8 max-w-5xl space-y-4">
            {[
              {
                title: "Full-screen first view",
                body: "The landing page opens with a single focused hero, not a split layout.",
              },
              {
                title: "Big search bar",
                body: "The repository input is the primary action and reads like a command bar.",
              },
              {
                title: "Instant routing",
                body: "When the repo is analyzed, the app can route into the workspace flow.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-surface p-5 shadow-[0_16px_50px_-42px_rgba(0,0,0,0.75)]"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
