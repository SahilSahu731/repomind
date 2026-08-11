"use client";

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CREDITS_CHANGED_EVENT } from "@/lib/creditBalance";
import { useUserStore } from "@/lib/store/userStore";

export function UserSessionSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const syncUser = useCallback(async () => {
    if (!session?.user?.id) return;

    let plan = session.user.plan;
    let creditsRemaining = session.user.creditsRemaining;

    try {
      const response = await fetch("/api/user/balance", { cache: "no-store" });
      const payload = (await response.json()) as
        | { success: true; data: { plan: typeof plan; creditsRemaining: number } }
        | { success: false };

      if (response.ok && payload.success) {
        plan = payload.data.plan;
        creditsRemaining = payload.data.creditsRemaining;
      }
    } catch {
      // The session values remain a safe fallback when account storage is unavailable.
    }

    setUser({
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      plan,
      creditsRemaining,
      githubUsername: session.user.githubUsername ?? null,
    });
  }, [session, setUser]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      clearUser();
      return;
    }

    void syncUser();
  }, [clearUser, session?.user?.id, status, syncUser]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const refresh = () => void syncUser();
    window.addEventListener(CREDITS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(CREDITS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [session?.user?.id, syncUser]);

  return null;
}
