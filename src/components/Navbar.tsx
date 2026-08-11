"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

const navLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#workflow", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const source = session?.user?.name || session?.user?.email || "R";
    return source.charAt(0).toUpperCase();
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
        setIsMobileOpen(false);
      }
    }

    window.addEventListener("click", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#292721] bg-[#f5f0e5]/95 text-[#292721] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
        <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-[-.025em]">
          <BrandMark className="h-7 w-7 text-[#d75c3f]" />
          RepoMind
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#c94f34]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAccountOpen((value) => !value)}
                className="group flex items-center gap-2 rounded-full border border-[#292721] p-1.5 pr-3 transition hover:bg-[#292721] hover:text-[#f5f0e5]"
                aria-label="Open account menu"
                aria-expanded={isAccountOpen}
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d75c3f] text-xs font-semibold text-white">
                    {userInitial}
                  </span>
                )}
                <span className="hidden text-sm font-medium sm:inline">{session.user.name ?? "Account"}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {isAccountOpen ? (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#292721] bg-[#f5f0e5] p-2 shadow-xl">
                  <div className="border-b border-[#292721]/20 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{session.user.name ?? "User"}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6d675f]">{session.user.email}</p>
                  </div>
                  <Link href="/user/dashboard" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[#e9e1d2]" onClick={() => setIsAccountOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/user/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[#e9e1d2]" onClick={() => setIsAccountOpen(false)}>
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#a33f2b] hover:bg-[#eadbd2]">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden px-2 py-2 text-sm font-medium transition hover:text-[#c94f34] sm:inline">
                Sign in
              </Link>
              <Link href="/#analyze" className="hidden rounded-full bg-[#292721] px-5 py-2.5 text-sm font-medium text-[#f5f0e5] transition hover:bg-[#d75c3f] sm:inline-flex">
                Try RepoMind
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={isMobileOpen}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#292721] md:hidden"
          >
            {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isMobileOpen ? (
        <nav aria-label="Mobile navigation" className="border-t border-[#292721] bg-[#f5f0e5] px-6 py-5 md:hidden">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)} className="border-b border-[#292721]/20 py-4 text-lg font-medium">
                {link.label}
              </Link>
            ))}
            {!session?.user ? (
              <div className="mt-5 flex gap-3">
                <Link href="/login" className="flex h-12 flex-1 items-center justify-center rounded-full border border-[#292721] text-sm font-medium">Sign in</Link>
                <Link href="/#analyze" onClick={() => setIsMobileOpen(false)} className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#292721] text-sm font-medium text-[#f5f0e5]">Try RepoMind</Link>
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
