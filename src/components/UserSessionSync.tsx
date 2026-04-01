"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/lib/store/userStore";

export function UserSessionSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user?.id) {
      clearUser();
      return;
    }

    setUser({
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      plan: session.user.plan,
      creditsRemaining: session.user.creditsRemaining,
      githubUsername: session.user.githubUsername ?? null,
    });
  }, [session, status, setUser, clearUser]);

  return null;
}
