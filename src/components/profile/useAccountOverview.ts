"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import type {
  AccountOverview,
  AccountOverviewErrorResponse,
  AccountOverviewResponse,
} from "@/types/account";

export function useAccountOverview() {
  const setUser = useUserStore((state) => state.setUser);
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/overview", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | AccountOverviewResponse
        | AccountOverviewErrorResponse;

      if (!response.ok || !payload.success) {
        setError(payload.success ? "Your profile could not be loaded." : payload.error.message);
        return;
      }

      setOverview(payload.data);
      setUser(payload.data.user);
    } catch {
      setError("Your account data could not be reached. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setUser]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!overview || overview.summary.inProgress === 0) return;

    const interval = window.setInterval(() => {
      void loadOverview(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadOverview, overview]);

  return {
    overview,
    isLoading,
    isRefreshing,
    error,
    reload: loadOverview,
  };
}
