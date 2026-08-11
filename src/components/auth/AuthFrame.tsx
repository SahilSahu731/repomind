import Link from "next/link";
import { ArrowDownRight, ShieldCheck } from "lucide-react";
import { AuthIllustration } from "./AuthIllustration";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  visualTitle: string;
  children: React.ReactNode;
  footerLink: {
    href: string;
    label: string;
    text: string;
  };
}

export function AuthFrame({
  title,
  subtitle,
  eyebrow,
  visualTitle,
  children,
  footerLink,
}: AuthFrameProps) {
  return (
    <main id="auth-content" className="relative h-[calc(100svh-4rem)] overflow-hidden lg:h-[calc(100svh-5rem)]">
      <div className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
      <section className="relative mx-auto grid h-full max-w-[90rem] lg:grid-cols-[minmax(30rem,.82fr)_1.18fr]">
        <div className="flex min-h-0 items-center px-5 py-5 sm:px-10 sm:py-8 lg:border-r lg:border-[#292721] lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[31rem] lg:mx-0">
            <p className="auth-optional-copy font-mono text-[9px] font-medium uppercase tracking-[.18em] text-[#6d675f]">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-[10ch] font-serif text-[clamp(2.75rem,7vh,5.7rem)] font-normal leading-[.88] tracking-[-.055em] text-[#292721] sm:mt-4">
              {title}
            </h1>
            <p className="auth-optional-copy mt-3 max-w-[29rem] text-sm leading-5 text-[#5e5952] sm:mt-4 sm:text-[15px] sm:leading-6">{subtitle}</p>

            <div className="mt-4 sm:mt-5">{children}</div>

            <p className="mt-4 border-t border-[#292721]/20 pt-3 text-sm text-[#6d675f] sm:mt-5 sm:pt-4">
              {footerLink.text}{" "}
              <Link
                href={footerLink.href}
                className="group inline-flex items-center gap-1.5 font-semibold text-[#292721] transition hover:text-[#c94f34]"
              >
                {footerLink.label}
                <ArrowDownRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </Link>
            </p>

            <div className="auth-security mt-3 hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#777168] sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#667a60]" />
              Protected session · Your repositories stay read-only
            </div>
          </div>
        </div>

        <aside className="relative hidden overflow-hidden bg-[#e8dfcf] text-[#292721] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-9 xl:px-16 xl:py-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#d75c3f]" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d675f]">Repository intelligence</p>
              <h2 className="mt-4 max-w-[13ch] font-serif text-[clamp(2.2rem,4.2vh,4.4rem)] font-normal leading-[.96] tracking-[-.04em]">
                {visualTitle}
              </h2>
            </div>
            <span className="mt-1 flex shrink-0 items-center gap-2 border border-[#292721]/35 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.13em] text-[#5e5952]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d75c3f]" />
              Live map
            </span>
          </div>

          <div className="relative min-h-0 flex-1 py-3">
            <AuthIllustration className="h-full w-full" />
          </div>

          <div className="relative grid grid-cols-3 border-t border-[#292721]/25 pt-4">
            {[
              ["01", "Map"],
              ["02", "Understand"],
              ["03", "Contribute"],
            ].map(([number, label]) => (
              <div key={number}>
                <p className="font-mono text-[8px] tracking-[.15em] text-[#c94f34]">{number}</p>
                <p className="mt-1 text-xs text-[#5e5952]">{label}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
