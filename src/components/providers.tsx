"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { UserSessionSync } from "@/components/UserSessionSync";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initAnalytics, trackPage } from "@/lib/analytics";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // track page on route change
    if (pathname) trackPage(pathname);
  }, [pathname]);

  return (
    <SessionProvider>
      <UserSessionSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
