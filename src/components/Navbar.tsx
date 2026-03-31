"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#ede0ce] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
        <Link href="/" className="text-[1.06rem] font-semibold tracking-tight text-[#201912]">
          RepoMind <span className="text-[#8f7458]">Labs</span>
        </Link>

        <nav className="hidden items-center gap-9 text-sm text-[#5f5346] md:flex">
          <Link href="/#features" className="transition hover:text-[#201b16]">
            Features
          </Link>
          <Link href="/#segments" className="transition hover:text-[#201b16]">
            Segments
          </Link>
          <Link href="/#workflow" className="transition hover:text-[#201b16]">
            Workflow
          </Link>
          <Link href="/#pricing" className="transition hover:text-[#201b16]">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-[#5f5346] sm:inline">
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-[#ddcbb5] bg-white/95 px-4 py-2 text-sm font-medium transition hover:bg-[#faf6f0]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-[#5f5346] transition hover:text-[#201b16] sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-[#ddcbb5] bg-white/95 px-4 py-2 text-sm font-medium transition hover:shadow-md"
              >
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
