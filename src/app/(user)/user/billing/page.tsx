"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";

const FREE_CREDIT_ALLOWANCE = 3;

export default function UserBillingPage() {
  const user = useUserStore((state) => state.user);
  const credits = Math.max(0, user?.creditsRemaining ?? 0);
  const visibleCredits = Math.min(credits, FREE_CREDIT_ALLOWANCE);
  const plan = user?.plan ?? "FREE";
  const isFree = plan === "FREE";

  return (
    <div className="space-y-10 py-2">
      <section className="grid border border-[#292721] bg-[#292721] lg:grid-cols-[1.16fr_.84fr]">
        <div className="bg-[#f7f2e7] p-6 sm:p-9 lg:p-10">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c94f34]">
            Access / Account truth
          </p>
          <h2 className="mt-6 max-w-[10ch] font-serif text-[clamp(3.8rem,7.2vw,7.2rem)] font-normal leading-[.82] tracking-[-.065em] text-[#292721]">
            Know exactly what you have.
          </h2>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-[#5e5952] sm:text-base">
            Your plan and analysis balance come directly from your workspace. RepoMind does not currently charge cards, create invoices, or renew subscriptions.
          </p>
        </div>

        <aside className="flex flex-col bg-[#e8dfcf] p-6 sm:p-9 lg:p-10">
          <div className="flex items-start justify-between gap-5 border-b border-[#292721] pb-6">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f]">Current access</p>
              <p className="mt-3 font-serif text-5xl tracking-[-.055em]">{plan}</p>
            </div>
            <ShieldCheck className="h-7 w-7 text-[#667a60]" />
          </div>
          <dl className="divide-y divide-[#292721]/25">
            <div className="flex items-end justify-between gap-5 py-5">
              <dt className="text-sm font-semibold">Analyses remaining</dt>
              <dd className="font-serif text-5xl leading-none tracking-[-.05em]">{user ? credits : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 py-5">
              <dt className="text-sm font-semibold">Payment method</dt>
              <dd className="text-xs text-[#6d675f]">None on file</dd>
            </div>
            <div className="flex items-center justify-between gap-5 py-5">
              <dt className="text-sm font-semibold">Next charge</dt>
              <dd className="text-xs text-[#6d675f]">No charge scheduled</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-px border border-[#292721] bg-[#292721] lg:grid-cols-[.8fr_1.2fr]">
        <article className="bg-[#292721] p-7 text-[#f5f0e5] sm:p-9">
          <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#e89980]">01 / Credit ledger</p>
          <h3 className="mt-5 max-w-[8ch] font-serif text-5xl leading-[.92] tracking-[-.055em]">
            A simple balance. No mystery meter.
          </h3>
          <CircleDollarSign className="mt-12 h-8 w-8 text-[#9aaa91]" />
        </article>

        <article className="bg-[#f7f2e7] p-7 sm:p-9">
          <div className="flex flex-col gap-5 border-b border-[#292721] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">Available now</p>
              <p className="mt-2 font-serif text-4xl tracking-[-.045em]">
                {user ? `${credits} ${credits === 1 ? "analysis" : "analyses"}` : "Syncing balance…"}
              </p>
            </div>
            {isFree ? (
              <div className="grid grid-cols-3 gap-1.5" aria-label={`${credits} of ${FREE_CREDIT_ALLOWANCE} free analysis credits remaining`}>
                {[0, 1, 2].map((index) => (
                  <span key={index} className={`h-2 w-10 ${index < visibleCredits ? "bg-[#667a60]" : "bg-[#d6ccba]"}`} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-5 pt-7 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">What uses a credit</p>
              <p className="mt-2 text-xs leading-5 text-[#6d675f]">A newly completed repository analysis consumes one free credit. Opening an existing saved report does not.</p>
            </div>
            <div>
              <p className="text-sm font-semibold">What happens at zero</p>
              <p className="mt-2 text-xs leading-5 text-[#6d675f]">Your workspace and completed reports remain available. Only new analyses are paused.</p>
            </div>
          </div>
          <Link href="/user/dashboard" className="group mt-8 inline-flex h-11 items-center gap-2 border border-[#292721] bg-[#292721] px-5 text-xs font-semibold text-[#f5f0e5] transition hover:bg-[#d75c3f]">
            Go to repositories <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </article>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <article>
          <div className="flex items-center justify-between border-b border-[#292721] pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">02 / Paid access</p>
              <h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Not quietly billing you.</h3>
            </div>
            <Clock3 className="h-5 w-5 text-[#667a60]" />
          </div>
          <p className="mt-5 text-sm leading-7 text-[#5e5952]">
            Paid access is being prepared. Checkout, subscription renewal, and invoice history will appear here only after they are connected to verified payment records.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 border border-[#292721] bg-[#e8dfcf] px-4 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#5e5952]">
            <Sparkles className="h-3.5 w-3.5 text-[#d75c3f]" /> Coming later · No payment collected
          </div>
        </article>

        <article>
          <div className="flex items-center justify-between border-b border-[#292721] pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#c94f34]">03 / Billing record</p>
              <h3 className="mt-2 font-serif text-4xl tracking-[-.05em]">Nothing invented.</h3>
            </div>
            <FileText className="h-5 w-5 text-[#667a60]" />
          </div>
          <div className="mt-5 border border-dashed border-[#8a8378] bg-[#eee6d7] p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#667a60] text-white"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-semibold">No invoices or transactions</p>
                <p className="mt-2 text-xs leading-5 text-[#6d675f]">This account has no RepoMind payment history because billing is not enabled.</p>
              </div>
            </div>
          </div>
          <Link href="/terms" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold underline decoration-[#d75c3f] underline-offset-4">
            Read access and payment terms <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>
      </section>
    </div>
  );
}
