"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const source = session?.user?.name || session?.user?.email || "R";
    return source.charAt(0).toUpperCase();
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) {
        return;
      }

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#ede0ce] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-330 items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
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
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="group flex items-center gap-2 rounded-full border border-[#decab0] bg-[linear-gradient(145deg,#fffaf2_0%,#fff4e6_100%)] px-2 py-1.5 shadow-[0_10px_20px_-16px_rgba(44,24,5,0.7)] transition hover:shadow-[0_16px_28px_-20px_rgba(44,24,5,0.8)]"
                aria-label="Toggle user menu"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full border border-[#e2c9a9] object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2b2219] text-xs font-semibold text-[#f7e8d6]">
                    {userInitial}
                  </span>
                )}
                <span className="hidden text-sm font-medium text-[#4a3c2f] sm:inline">
                  {session.user.name ?? "Account"}
                </span>
                <ChevronDown className="h-4 w-4 text-[#7f6a52]" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[#e5d3bc] bg-white/95 p-2 shadow-[0_24px_40px_-28px_rgba(45,25,6,0.8)] backdrop-blur">
                  <div className="rounded-xl bg-[#fff8ef] px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[#33261a]">
                      {session.user.name ?? "User"}
                    </p>
                    <p className="truncate text-xs text-[#725f4a]">{session.user.email}</p>
                  </div>

                  <Link
                    href="/user/dashboard"
                    className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#3d3024] transition hover:bg-[#fff6ea]"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/user/settings"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#3d3024] transition hover:bg-[#fff6ea]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#6a2d24] transition hover:bg-[#fff1ec]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
