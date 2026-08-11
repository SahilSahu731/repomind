import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f0e5] px-6 text-[#292721]">
      <div className="w-full max-w-3xl border-y border-[#292721] py-14 text-center sm:py-20">
        <BrandMark className="mx-auto h-10 w-10 text-[#d75c3f]" />
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">404 · Path not found</p>
        <h1 className="mt-6 font-serif text-5xl leading-none tracking-[-.045em] sm:text-7xl">
          This route is outside the map.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-[#5e5952]">
          The page may have moved, or the address may be incomplete. Return to RepoMind and begin from a repository.
        </p>
        <Link href="/" className="mt-9 inline-flex h-13 items-center gap-2 rounded-full bg-[#292721] px-6 text-sm font-medium text-[#f5f0e5] transition hover:bg-[#d75c3f]">
          <ArrowLeft className="h-4 w-4" /> Return home
        </Link>
      </div>
    </main>
  );
}
