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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-330 items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
        <Link href="/" className="text-[1.06rem] font-semibold tracking-tight text-[var(--foreground)]">
          RepoMind <span className="text-[var(--secondary)]">Labs</span>
        </Link>

        <nav className="hidden items-center gap-9 text-sm text-[var(--muted)] md:flex">
          <Link href="/#features" className="transition hover:text-[var(--foreground)]">
            Features
          </Link>
          <Link href="/#segments" className="transition hover:text-[var(--foreground)]">
            Segments
          </Link>
          <Link href="/#workflow" className="transition hover:text-[var(--foreground)]">
            Workflow
          </Link>
          <Link href="/#pricing" className="transition hover:text-[var(--foreground)]">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="group flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 transition hover:bg-[var(--surface-3)]"
                aria-label="Toggle user menu"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-3)] text-xs font-semibold text-[var(--foreground)]">
                    {userInitial}
                  </span>
                )}
                <span className="hidden text-sm font-medium text-[var(--foreground)] sm:inline">
                  {session.user.name ?? "Account"}
                </span>
                <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 backdrop-blur">
                  <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {session.user.name ?? "User"}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">{session.user.email}</p>
                  </div>

                  <Link
                    href="/user/dashboard"
                    className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/user/settings"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
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
                className="hidden text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-3)]"
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
