"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowUpRight,
  BarChart3,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { useMemo } from "react";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/userStore";

interface UserWorkspaceLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard, number: "01" },
  { href: "/user/profile", label: "Profile", icon: CircleUserRound, number: "02" },
  { href: "/user/activity", label: "Activity", icon: BarChart3, number: "03" },
  { href: "/user/billing", label: "Billing", icon: CreditCard, number: "04" },
  { href: "/user/settings", label: "Settings", icon: Settings, number: "05" },
];

export default function UserWorkspaceLayout({ children }: UserWorkspaceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  const userInitial = useMemo(() => {
    const source = user?.name || user?.email || "R";
    return source.charAt(0).toUpperCase();
  }, [user?.email, user?.name]);

  const activePage = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Workspace";

  async function onSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="marketing-theme min-h-svh bg-[#f5f0e5] text-[#292721]">
      <div className="flex min-h-svh w-full flex-col lg:flex-row">
        <aside className="border-b border-[#292721] bg-[#e8dfcf] lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex h-18 items-center justify-between border-b border-[#292721] px-5 lg:h-22 lg:px-7">
            <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-[-.025em]">
              <BrandMark className="h-7 w-7 text-[#d75c3f]" />
              RepoMind
            </Link>
            <span className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f] lg:hidden">
              {activePage}
            </span>
          </div>

          <nav aria-label="Workspace navigation" className="flex overflow-x-auto px-3 py-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4 lg:py-7">
            <p className="mb-4 hidden px-3 font-mono text-[8px] uppercase tracking-[.18em] text-[#6d675f] lg:block">
              Workspace index
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-sm transition lg:mb-1 lg:w-full",
                    isActive
                      ? "bg-[#292721] text-[#f5f0e5]"
                      : "text-[#5e5952] hover:bg-[#d9ceba] hover:text-[#292721]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  <span className={cn("ml-auto hidden font-mono text-[8px] lg:block", isActive ? "text-[#d97757]" : "text-[#8a8378]")}>{item.number}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden border-t border-[#292721] p-5 lg:block">
            <div className="mb-5 border-l-2 border-[#d75c3f] pl-3">
              <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f]">Current plan</p>
              <div className="mt-1.5 flex items-end justify-between gap-3">
                <p className="font-serif text-2xl leading-none">{user?.plan ?? "FREE"}</p>
                <p className="text-xs text-[#6d675f]">{user?.creditsRemaining ?? "—"} credits</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-9 w-9 rounded-full border border-[#292721] object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d75c3f] text-sm font-semibold text-white">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name ?? "Account"}</p>
                <p className="truncate text-[10px] text-[#6d675f]">{user?.email ?? "Loading session"}</p>
              </div>
              <button type="button" onClick={onSignOut} aria-label="Sign out" className="grid h-8 w-8 place-items-center border border-[#292721]/40 text-[#6d675f] transition hover:bg-[#292721] hover:text-[#f5f0e5]">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 hidden h-22 items-center justify-between border-b border-[#292721] bg-[#f5f0e5]/95 px-8 backdrop-blur-md lg:flex xl:px-12">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.18em] text-[#6d675f]">RepoMind / User workspace</p>
              <h1 className="mt-1 font-serif text-2xl tracking-[-.035em]">{activePage}</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-medium">{user?.name ?? "Your workspace"}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">Read-only analysis</p>
              </div>
              <Link href="/" className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#292721] px-4 text-xs font-medium transition hover:bg-[#292721] hover:text-[#f5f0e5]">
                Visit site
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </header>

          <main className="relative min-h-[calc(100svh-7.5rem)] overflow-hidden lg:min-h-[calc(100svh-5.5rem)]">
            <div className="marketing-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative mx-auto w-full max-w-[92rem] p-5 sm:p-8 lg:p-10 xl:p-12">{children}</div>
          </main>
        </section>
      </div>
    </div>
  );
}
