import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bug, Database, LifeBuoy, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with RepoMind accounts, repository analysis, privacy, and data requests.",
  alternates: { canonical: "/support" },
};

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-6 py-14 sm:px-10 sm:py-20 lg:px-16 xl:px-20">
      <section className="grid border border-[#292721] bg-[#292721] lg:grid-cols-[1.15fr_.85fr]">
        <div className="bg-[#f7f2e7] p-7 sm:p-11 lg:p-14">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">Support / Human route</p>
          <h1 className="mt-7 max-w-[9ch] font-serif text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.065em]">Tell us where the map broke.</h1>
          <p className="mt-8 max-w-2xl text-sm leading-7 text-[#5e5952] sm:text-base">
            Share the repository URL, what you expected, and the step that failed. Never send passwords, access tokens, private keys, or private source code.
          </p>
        </div>
        <aside className="flex flex-col justify-between bg-[#e8dfcf] p-7 sm:p-11 lg:p-14">
          <LifeBuoy className="h-9 w-9 text-[#667a60]" />
          <div className="mt-16">
            <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">Primary support channel</p>
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="mt-3 inline-flex break-all font-serif text-3xl tracking-[-.04em] underline decoration-[#d75c3f] underline-offset-8">
                {supportEmail}
              </a>
            ) : (
              <a href={`${siteConfig.links.github}/issues/new`} target="_blank" rel="noreferrer" className="group mt-3 inline-flex items-center gap-2 font-serif text-3xl tracking-[-.04em] underline decoration-[#d75c3f] underline-offset-8">
                Open a GitHub issue <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
            <p className="mt-6 text-xs leading-5 text-[#6d675f]">
              {supportEmail
                ? "Account and privacy requests are handled through this address. Identity verification may be required."
                : "Issues are public. Do not include account details or personal information. Configure NEXT_PUBLIC_SUPPORT_EMAIL before launch to accept private account and deletion requests."}
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-12 grid gap-px border border-[#292721] bg-[#292721] md:grid-cols-3">
        {[
          [Bug, "Analysis problem", "Include the public repository URL, branch, approximate time, and the visible error message."],
          [Database, "Data request", "Ask to export, correct, or delete saved account and report information."],
          [ShieldCheck, "Security report", "Do not publish exploit details. Use the configured private support address when available."],
        ].map(([Icon, title, description]) => {
          const ItemIcon = Icon as typeof Bug;
          return (
            <article key={String(title)} className="bg-[#f7f2e7] p-7 sm:p-8">
              <ItemIcon className="h-5 w-5 text-[#d75c3f]" />
              <h2 className="mt-8 font-serif text-3xl tracking-[-.04em]">{String(title)}</h2>
              <p className="mt-4 text-sm leading-6 text-[#5e5952]">{String(description)}</p>
            </article>
          );
        })}
      </section>

      <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold">
        <Link href="/privacy" className="underline decoration-[#d75c3f] underline-offset-4">Privacy policy</Link>
        <Link href="/data-controls" className="underline decoration-[#d75c3f] underline-offset-4">Data controls</Link>
        <Link href="/terms" className="underline decoration-[#d75c3f] underline-offset-4">Terms of service</Link>
      </div>
    </div>
  );
}
