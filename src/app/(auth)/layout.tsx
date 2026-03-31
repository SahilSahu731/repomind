"use client";

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Auth Navbar - Minimal */}
      <header className="border-b border-[#ede0ce] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
          <Link href="/" className="text-[1.06rem] font-semibold tracking-tight text-[#201912]">
            RepoMind <span className="text-[#8f7458]">Labs</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[#5f5346] transition hover:text-[#201912]"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
