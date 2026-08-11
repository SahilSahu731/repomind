import Link from "next/link";
import { ArrowRight, Boxes, GitBranch, Route, ScanSearch } from "lucide-react";
import { RepoAnalyzeBar } from "./RepoAnalyzeBar";

const capabilities = [
  {
    number: "01",
    title: "See the system, not just its files.",
    body: "RepoMind groups the repository into architectural layers and modules, then explains what each part is responsible for.",
    icon: Boxes,
    detail: "Architecture map",
  },
  {
    number: "02",
    title: "Follow every important connection.",
    body: "A navigable dependency graph exposes high-connectivity files, coupling, entry points, and likely change surfaces.",
    icon: GitBranch,
    detail: "Dependency graph",
  },
  {
    number: "03",
    title: "Know where to begin.",
    body: "A project-aware start guide turns an unfamiliar codebase into an ordered reading path for engineers joining the work.",
    icon: Route,
    detail: "Onboarding guide",
  },
  {
    number: "04",
    title: "Find the friction hiding in plain sight.",
    body: "Repository signals are translated into maintainability findings, architecture issues, and a contribution-readiness score.",
    icon: ScanSearch,
    detail: "Risk and readiness",
  },
];

export function LandingProof() {
  return (
    <section id="product" className="border-b border-[#292721]">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid border-b border-[#292721] lg:grid-cols-[.62fr_1.38fr]">
          <div className="border-[#292721] px-6 py-10 sm:px-10 lg:border-r lg:px-16 lg:py-16 xl:px-20">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">What RepoMind reveals</p>
          </div>
          <div className="px-6 py-10 sm:px-10 lg:px-16 lg:py-16 xl:px-20">
            <h2 className="max-w-[17ch] font-serif text-[clamp(2.7rem,5.2vw,5.6rem)] font-normal leading-[.98] tracking-[-.045em] text-[#292721]">
              Complexity becomes useful when it has a shape.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8">
              A repository contains more than source code. It contains decisions, boundaries, dependencies,
              and the path a new contributor must discover. RepoMind makes that hidden system visible.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`group min-h-[24rem] border-[#292721] p-6 transition-colors hover:bg-[#ebe4d4] sm:p-10 lg:p-14 ${
                  index % 2 === 0 ? "md:border-r" : ""
                } ${index < 2 ? "border-b" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] tracking-[.16em] text-[#6d675f]">{item.number}</span>
                  <Icon className="h-8 w-8 stroke-[1.35] text-[#d75c3f] transition-transform group-hover:rotate-6 group-hover:scale-110" />
                </div>
                <h3 className="mt-16 max-w-[16ch] font-serif text-3xl leading-[1.05] tracking-[-.035em] text-[#292721] sm:text-4xl">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#5e5952] sm:text-base">{item.body}</p>
                <p className="mt-8 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7b8f72]" />
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingFlow() {
  return (
    <section id="workflow" className="border-b border-[#292721] bg-[#292721] text-[#f4efe4]">
      <div className="mx-auto max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#aaa398]">From link to understanding</p>
            <h2 className="mt-7 max-w-[11ch] font-serif text-[clamp(3rem,5.5vw,6rem)] font-normal leading-[.94] tracking-[-.045em]">
              A clearer first hour with any codebase.
            </h2>
          </div>

          <ol className="border-t border-white/25">
            {[
              ["01", "Paste a public GitHub URL", "Choose a repository and, when needed, the branch you want RepoMind to inspect."],
              ["02", "RepoMind builds the map", "The analysis pipeline reads structure, detects technologies and entry points, and resolves internal dependencies."],
              ["03", "AI turns signals into context", "The raw graph becomes architecture explanations, risks, file-level insights, and an onboarding sequence."],
              ["04", "Explore from one workspace", "Move between overview, architecture, dependency graph, file explorer, guide, and repository-aware chat."],
            ].map(([number, title, body]) => (
              <li key={number} className="grid gap-4 border-b border-white/25 py-7 sm:grid-cols-[4rem_1fr] sm:gap-7">
                <span className="font-mono text-[10px] tracking-[.16em] text-[#d97757]">{number}</span>
                <div>
                  <h3 className="text-lg font-medium tracking-[-.02em] sm:text-xl">{title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#bdb7ac]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function LandingAnalyze() {
  return (
    <section id="analyze" className="border-b border-[#292721]">
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[.78fr_1.22fr]">
        <div className="border-[#292721] px-6 py-16 sm:px-10 lg:border-r lg:px-16 lg:py-24 xl:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Start with one repository</p>
          <h2 className="mt-7 max-w-[10ch] font-serif text-[clamp(3rem,5vw,5.8rem)] font-normal leading-[.94] tracking-[-.05em] text-[#292721]">
            See what your code is trying to tell you.
          </h2>
          <p className="mt-7 max-w-md text-base leading-7 text-[#5e5952]">
            Public repositories are supported today. Sign in or create an account to start an analysis and keep the result in your workspace.
          </p>
        </div>
        <div className="flex items-center bg-[#eae2d2] px-6 py-16 sm:px-10 lg:px-16 lg:py-24 xl:px-20">
          <RepoAnalyzeBar />
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section id="pricing" className="bg-[#d75c3f] text-[#201f1b]">
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[1.15fr_.85fr]">
        <div className="border-[#201f1b] px-6 py-16 sm:px-10 lg:border-r lg:px-16 lg:py-24 xl:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[.18em]">Simple access</p>
          <h2 className="mt-7 max-w-[12ch] font-serif text-[clamp(3.2rem,6vw,6.5rem)] font-normal leading-[.9] tracking-[-.05em]">
            Begin with clarity. Keep it as you grow.
          </h2>
        </div>
        <div className="flex flex-col justify-between px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div>
            <p className="text-lg leading-8">
              New accounts start with free analysis credits. Need more? Add a repository for ₹99 or move to Pro for ongoing work.
            </p>
            <div className="mt-8 border-t border-[#201f1b]/40 pt-5 font-mono text-[10px] uppercase tracking-[.14em]">
              Public GitHub repositories · Results saved to your workspace
            </div>
          </div>
          <Link
            href="/signup"
            className="group mt-12 inline-flex h-14 w-fit items-center gap-4 rounded-full bg-[#201f1b] px-7 text-sm font-medium text-[#f4efe4] transition hover:bg-[#f4efe4] hover:text-[#201f1b]"
          >
            Create your account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
