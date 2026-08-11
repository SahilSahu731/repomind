import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export interface LegalSection {
  title: string;
  body?: string[];
  items?: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  introduction: string;
  updated: string;
  sections: LegalSection[];
}

export function LegalPage({
  eyebrow,
  title,
  introduction,
  updated,
  sections,
}: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-6 py-14 sm:px-10 sm:py-20 lg:px-16 xl:px-20">
      <div className="grid border-y border-[#292721] lg:grid-cols-[.72fr_1.28fr]">
        <header className="border-b border-[#292721] py-10 lg:border-b-0 lg:border-r lg:py-16 lg:pr-12">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
            {eyebrow}
          </p>
          <h1 className="mt-7 max-w-[9ch] font-serif text-[clamp(3.8rem,7vw,7.5rem)] leading-[.86] tracking-[-.06em]">
            {title}
          </h1>
          <p className="mt-8 max-w-md text-sm leading-7 text-[#5e5952]">
            {introduction}
          </p>
          <p className="mt-8 font-mono text-[9px] uppercase tracking-[.14em] text-[#6d675f]">
            Last updated · {updated}
          </p>
        </header>

        <div className="divide-y divide-[#292721] lg:pl-12">
          {sections.map((section, index) => (
            <section key={section.title} className="py-9 sm:py-11">
              <div className="grid gap-5 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-[9px] text-[#c94f34]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-serif text-3xl tracking-[-.04em] sm:text-4xl">
                    {section.title}
                  </h2>
                  {section.body?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 max-w-3xl text-sm leading-7 text-[#5e5952]">
                      {paragraph}
                    </p>
                  ))}
                  {section.items ? (
                    <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#5e5952]">
                      {section.items.map((item) => (
                        <li key={item} className="grid grid-cols-[.6rem_1fr] gap-3">
                          <span aria-hidden className="mt-[.58rem] h-1.5 w-1.5 rounded-full bg-[#d75c3f]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-[#d75c3f] underline-offset-4">
          <ArrowLeft className="h-4 w-4" /> Return home
        </Link>
        <Link href="/support" className="group inline-flex items-center gap-2 text-sm font-semibold">
          Need help? Contact support
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
