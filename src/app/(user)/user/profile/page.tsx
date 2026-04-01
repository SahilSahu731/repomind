"use client";

import { useUserStore } from "@/lib/store/userStore";

export default function UserProfilePage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#eadac2] bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#2a2118]">Profile</h2>
        <p className="mt-2 text-sm text-[#625546]">Your account identity and plan details synced from session.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#ebdcc8] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8b7a65]">Name</p>
          <p className="mt-2 text-base font-medium text-[#2f2419]">{user?.name ?? "Not set"}</p>
        </div>
        <div className="rounded-2xl border border-[#ebdcc8] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8b7a65]">Email</p>
          <p className="mt-2 text-base font-medium text-[#2f2419]">{user?.email ?? "Not available"}</p>
        </div>
        <div className="rounded-2xl border border-[#ebdcc8] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8b7a65]">GitHub Username</p>
          <p className="mt-2 text-base font-medium text-[#2f2419]">{user?.githubUsername ?? "Not connected"}</p>
        </div>
        <div className="rounded-2xl border border-[#ebdcc8] bg-[#fffdfa] p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-[#8b7a65]">Plan</p>
          <p className="mt-2 text-base font-medium text-[#2f2419]">{user?.plan ?? "FREE"}</p>
        </div>
      </section>
    </div>
  );
}
