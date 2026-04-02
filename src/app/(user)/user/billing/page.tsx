"use client";

import { useUserStore } from "@/lib/store/userStore";

export default function UserBillingPage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_100%)] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Billing</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Plan and credits overview from your current account session.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Current Plan</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{user?.plan ?? "FREE"}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Renews on May 2, 2026</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Credits Remaining</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{user?.creditsRemaining ?? 0}</p>
          <div className="mt-3 h-2 rounded-full bg-[var(--surface-3)]">
            <div className="h-full w-[72%] rounded-full bg-[var(--primary)]" />
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Recent Invoices</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <span>Apr 2026 - Pro Plan</span>
            <span className="text-[var(--secondary)]">$29.00</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <span>Mar 2026 - Pro Plan</span>
            <span className="text-[var(--secondary)]">$29.00</span>
          </div>
        </div>
      </section>
    </div>
  );
}
