import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, GitBranch, Map, ScanSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Why RepoMind exists and how it helps engineers find their footing in unfamiliar codebases.",
  alternates: { canonical: "/about" },
};

const principles = [
  [Map, "Map before directions", "Architecture only becomes useful when it shows where a change should begin and what it may affect."],
  [ScanSearch, "Evidence over theatre", "RepoMind grounds its report in files, imports, routes, configuration, and detected project structure."],
  [GitBranch, "Built for the first hour", "The goal is not to replace reading code. It is to make the first hour of reading dramatically more intentional."],
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-[#292721]">
        <div aria-hidden className="marketing-grid absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid min-h-[42rem] w-full max-w-[90rem] lg:grid-cols-[1.25fr_.75fr]">
          <div className="flex flex-col justify-between px-6 py-14 sm:px-10 sm:py-20 lg:border-r lg:border-[#292721] lg:px-16 xl:px-20">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">About / The reason</p>
            <div className="mt-24 lg:mt-36">
              <h1 className="max-w-[11ch] font-serif text-[clamp(4rem,8vw,8.5rem)] leading-[.82] tracking-[-.068em]">
                Codebases should introduce themselves.
              </h1>
            </div>
          </div>
          <aside className="flex flex-col justify-between bg-[#e8dfcf]/90 px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
            <Braces className="h-10 w-10 text-[#d75c3f]" />
            <div className="mt-20">
              <p className="font-serif text-3xl leading-[1.15] tracking-[-.04em] sm:text-4xl">
                RepoMind turns repository structure into a working mental model—before you make the first change.
              </p>
              <p className="mt-7 text-sm leading-7 text-[#5e5952]">
                It was made for the moment after opening a new repository, when every folder looks important and none of the relationships are obvious yet.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">01 / Point of view</p>
          </div>
          <div>
            <h2 className="max-w-[18ch] font-serif text-[clamp(3rem,6vw,6rem)] leading-[.9] tracking-[-.058em]">
              Understanding comes before acceleration.
            </h2>
            <div className="mt-10 grid gap-8 text-sm leading-7 text-[#5e5952] sm:grid-cols-2">
              <p>A codebase is more than a file tree. It is a set of boundaries, flows, conventions, and decisions that have accumulated over time.</p>
              <p>RepoMind surfaces those relationships so engineers can ask better questions, find the right entry points, and change code with context.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#292721] bg-[#292721]">
        <div className="mx-auto grid w-full max-w-[90rem] gap-px bg-[#292721] md:grid-cols-3">
          {principles.map(([Icon, title, description], index) => {
            const PrincipleIcon = Icon as typeof Map;
            return (
              <article key={String(title)} className="group bg-[#f7f2e7] p-7 transition-colors hover:bg-[#e8dfcf] sm:p-10 lg:p-12">
                <div className="flex items-center justify-between">
                  <PrincipleIcon className="h-6 w-6 text-[#667a60]" />
                  <span className="font-mono text-[9px] text-[#c94f34]">0{index + 1}</span>
                </div>
                <h2 className="mt-24 font-serif text-4xl tracking-[-.045em]">{String(title)}</h2>
                <p className="mt-5 max-w-sm text-sm leading-7 text-[#5e5952]">{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="flex flex-col items-start justify-between gap-10 border-t border-[#292721] pt-10 lg:flex-row lg:items-end">
          <h2 className="max-w-[13ch] font-serif text-5xl leading-[.94] tracking-[-.052em] sm:text-7xl">Bring a repository. Leave with a route in.</h2>
          <Link href="/#analyze" className="group inline-flex items-center gap-3 rounded-full bg-[#292721] px-6 py-3.5 text-sm font-semibold text-[#f5f0e5] transition hover:bg-[#d75c3f]">
            Analyze a repository <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
