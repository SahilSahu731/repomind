"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BriefcaseBusiness,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
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
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside
          className={cn(
            "relative flex h-full flex-col border-r border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-4 text-foreground transition-all duration-300 lg:shrink-0",
            collapsed ? "w-full lg:w-20" : "w-full lg:w-72"
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="absolute -right-3 top-6 hidden rounded-full border border-border bg-surface-2 p-1.5 text-foreground shadow lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-white/3 px-2 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,var(--primary)_0%,var(--primary-strong)_100%)] text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold tracking-tight">RepoMind Orbit</p>
                <p className="text-xs text-muted">User Workspace</p>
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
                      ? "bg-primary/20 text-foreground"
                      : "text-muted hover:bg-white/6 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-border bg-white/4 p-3">
            <div className="flex items-center gap-3">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt="User avatar"
                  className="h-9 w-9 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-semibold">
                  {userInitial}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "User"}</p>
                  <p className="truncate text-xs text-muted">{user?.email ?? "No email"}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={onSignOut}
                className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold tracking-wide text-foreground transition hover:bg-white/8"
              >
                Sign Out
              </button>
            )}
          </div>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.12em] text-secondary uppercase">User Workspace</p>
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Workspace"}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-secondary"
                >
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Primary Workspace
                </button>

                <button
                  type="button"
                  className="rounded-full border border-border bg-surface-2 p-2 text-foreground transition hover:bg-surface-3"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>

                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt="User avatar"
                    className="h-9 w-9 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2 text-foreground">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="flex-1 bg-background/30 p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </div>
  );
}
