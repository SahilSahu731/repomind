"use client";

import { useUserStore } from "@/lib/store/userStore";

export default function UserProfilePage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_100%)] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Profile</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Your account identity and plan details synced from session.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Name</p>
            <p className="mt-2 text-base font-medium text-[var(--foreground)]">{user?.name ?? "Not set"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Email</p>
            <p className="mt-2 text-base font-medium text-[var(--foreground)]">{user?.email ?? "Not available"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">GitHub Username</p>
            <p className="mt-2 text-base font-medium text-[var(--foreground)]">
              {user?.githubUsername ?? "Not connected"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,var(--surface-2)_0%,var(--surface-3)_100%)] p-5 text-[var(--foreground)]">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--secondary)]">Account Overview</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{user?.plan ?? "FREE"}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Active plan and trust status</p>

          <div className="mt-5 space-y-2 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-white/4 px-3 py-2">Workspace role: Owner</div>
            <div className="rounded-xl border border-[var(--border)] bg-white/4 px-3 py-2">2FA: Recommended</div>
            <div className="rounded-xl border border-[var(--border)] bg-white/4 px-3 py-2">Last login: 2 Apr 2026</div>
          </div>
        </div>
      </section>
    </div>
  );
}
