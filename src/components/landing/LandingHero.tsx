import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { HeroIllustration } from "./HeroIllustration";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#292721]">
      <div className="marketing-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-[90rem] lg:grid-cols-[1.03fr_.97fr]">
        <div className="flex flex-col justify-between border-[#292721] px-6 pb-12 pt-16 sm:px-10 sm:pt-24 lg:border-r lg:px-16 lg:pb-16 xl:px-20">
          <div>
            <p className="reveal font-mono text-[11px] font-medium uppercase tracking-[.18em] text-[#6d675f]">
              Repository intelligence, made legible
            </p>
            <h1 className="reveal mt-8 max-w-[12ch] font-serif text-[clamp(3.6rem,7.4vw,8rem)] font-normal leading-[.88] tracking-[-.055em] text-[#292721] [animation-delay:80ms]">
              Understand the code before you change it.
            </h1>
            <p className="reveal mt-8 max-w-[41rem] text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8 [animation-delay:160ms]">
              RepoMind turns a public GitHub repository into an architecture map, dependency graph,
              contribution score, and practical onboarding route—so your next decision starts with context.
            </p>
            <div className="reveal mt-9 flex flex-wrap items-center gap-4 [animation-delay:240ms]">
              <Link
                href="#analyze"
                className="group inline-flex h-13 items-center gap-3 rounded-full bg-[#292721] px-6 text-sm font-medium text-[#f5f0e5] transition hover:bg-[#d75c3f]"
              >
                Analyze a repository
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#product"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-[#292721] px-6 text-sm font-medium text-[#292721] transition hover:bg-[#292721] hover:text-[#f5f0e5]"
              >
                See what you get
                <ArrowDownRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid max-w-xl grid-cols-3 border-t border-[#292721]/35 pt-5 text-[#5e5952]">
            {[
              ["01", "Structure"],
              ["02", "Dependencies"],
              ["03", "Guidance"],
            ].map(([number, label]) => (
              <div key={number}>
                <p className="font-mono text-[9px] tracking-[.16em]">{number}</p>
                <p className="mt-1.5 text-xs sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center px-6 py-16 sm:px-10 lg:px-12 xl:px-16">
          <div className="absolute right-10 top-10 font-serif text-[10rem] leading-none text-[#d75c3f]/10" aria-hidden="true">
            R
          </div>
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
