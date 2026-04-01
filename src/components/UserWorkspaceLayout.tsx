"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, Bell, ChevronLeft, ChevronRight, CircleUserRound, CreditCard, FolderGit2, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/userStore";

interface UserWorkspaceLayoutProps {
  children: React.ReactNode;
}

interface UserNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: UserNavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/profile", label: "Profile", icon: CircleUserRound },
  { href: "/user/settings", label: "Settings", icon: Settings },
  { href: "/user/activity", label: "Activity", icon: BarChart3 },
  { href: "/user/billing", label: "Billing", icon: CreditCard },
];

export default function UserWorkspaceLayout({ children }: UserWorkspaceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);

  const userInitial = useMemo(() => {
    const source = user?.name || user?.email || "R";
    return source.charAt(0).toUpperCase();
  }, [user?.email, user?.name]);

  async function onSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#fff5de_0,#fef9f1_34%,#f8fbff_100%)] text-[#1f1a15]">
      <div className="mx-auto flex min-h-screen w-full max-w-375 gap-4 p-3 sm:gap-5 sm:p-4">
        <aside
          className={cn(
            "relative flex flex-col rounded-3xl border border-[#ecd7b6] bg-[linear-gradient(170deg,#1f1912_0%,#2c2015_45%,#3c2b1a_100%)] p-3 text-[#f8eddc] shadow-[0_34px_60px_-44px_rgba(24,14,4,0.8)] transition-all duration-300",
            collapsed ? "w-22" : "w-70"
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="absolute -right-3 top-6 rounded-full border border-[#e7d4b8] bg-[#fffdf8] p-1.5 text-[#473521] shadow"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <div className="mb-6 flex items-center gap-3 px-2 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,#ffe3b5_0%,#f8b86f_100%)] text-[#2f2112]">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold tracking-tight">RepoMind Orbit</p>
                <p className="text-xs text-[#d8c5ac]">User Workspace</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-2xl px-3 py-2.5 text-sm transition",
                    isActive
                      ? "bg-white/12 text-white"
                      : "text-[#d9c4ab] hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/6 p-3">
            <div className="flex items-center gap-3">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="User avatar" className="h-9 w-9 rounded-full border border-white/20 object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm font-semibold">
                  {userInitial}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user?.name ?? "User"}</p>
                  <p className="truncate text-xs text-[#d8c5ac]">{user?.email ?? "No email"}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={onSignOut}
                className="mt-3 w-full rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold tracking-wide text-[#f6e8d5] transition hover:bg-white/10"
              >
                Sign Out
              </button>
            )}
          </div>
        </aside>

        <section className="flex-1 rounded-3xl border border-[#ead8be] bg-white/80 shadow-[0_28px_60px_-50px_rgba(51,29,10,0.5)] backdrop-blur">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efe2ce] px-5 py-4 sm:px-7">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a775e]">Control Panel</p>
              <h1 className="text-lg font-semibold tracking-tight text-[#2a2118]">{NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Workspace"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-full border border-[#e7d8c2] bg-white p-2.5 text-[#5f4d38] transition hover:bg-[#fff8ef]" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link href="/user/dashboard" className="inline-flex items-center gap-2 rounded-full border border-[#d9c6ac] bg-[#fff8ef] px-3 py-1.5 text-xs font-medium text-[#5a4731]">
                <FolderGit2 className="h-3.5 w-3.5" />
                Repositories
              </Link>
            </div>
          </header>
          <div className="p-5 sm:p-7">{children}</div>
        </section>
      </div>
    </div>
  );
}
