"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-[70svh] place-items-center bg-[#f5f0e5] px-6 py-16 text-[#292721]">
      <div className="w-full max-w-3xl border-y border-[#292721] py-14 text-center sm:py-20">
        <BrandMark className="mx-auto h-10 w-10 text-[#d75c3f]" />
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[.18em] text-[#a33f2b]">Unexpected interruption</p>
        <h1 className="mt-6 font-serif text-5xl leading-none tracking-[-.045em] sm:text-7xl">This part of the map failed to load.</h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#5e5952]">
          Your repository has not been modified. Try this view again, or return to the workspace and reopen it.
        </p>
        {error.digest ? <p className="mt-4 font-mono text-[9px] uppercase tracking-[.12em] text-[#8a8378]">Reference · {error.digest}</p> : null}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => unstable_retry()} className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#292721] px-6 text-sm font-medium text-[#f5f0e5] transition hover:bg-[#d75c3f]">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link href="/user/dashboard" className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#292721] px-6 text-sm font-medium transition hover:bg-[#e8dfcf]">
            <ArrowLeft className="h-4 w-4" /> Return to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
