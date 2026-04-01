"use client";

import { useUserStore } from "@/lib/store/userStore";

export default function UserBillingPage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#ead9be] bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#2a2118]">Billing</h2>
        <p className="mt-2 text-sm text-[#635546]">Plan and credits overview from your current account session.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#ebdcc6] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8a7a65]">Current Plan</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#2f251a]">{user?.plan ?? "FREE"}</p>
        </article>
        <article className="rounded-2xl border border-[#ebdcc6] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8a7a65]">Credits Remaining</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#2f251a]">{user?.creditsRemaining ?? 0}</p>
        </article>
      </section>
    </div>
  );
}
