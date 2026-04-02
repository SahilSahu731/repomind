import Link from "next/link";
import { CheckCircle2, GitBranch, ShieldCheck, Sparkles } from "lucide-react";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink: {
    href: string;
    label: string;
    text: string;
  };
}

export function AuthFrame({ title, subtitle, children, footerLink }: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(103,232,249,0.10)_0%,transparent_34%),radial-gradient(circle_at_90%_10%,rgba(246,193,119,0.09)_0%,transparent_30%),var(--background)] px-6 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative overflow-hidden rounded-4xl border border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-6 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-8 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -right-4 top-24 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-background">
                  <Sparkles className="h-5 w-5" />
                </span>
                RepoMind Labs
              </Link>

              <h1 className="mt-8 max-w-[12ch] text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-[38ch] text-sm leading-7 text-muted sm:text-base">
                {subtitle}
              </p>

              <div className="mt-6 space-y-3 text-sm text-muted">
                {[
                  "Security-first authentication with GitHub support",
                  "Beautiful dark workspace tailored for repository analysis",
                  "One-click entry into the insight dashboard after sign-in",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-white/4 px-3 py-3">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Graph-ready", value: "Live" },
                { label: "Session sync", value: "Fast" },
                { label: "Repo routes", value: "Clean" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center rounded-4xl border border-border bg-surface p-4 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.8)] sm:p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                <GitBranch className="h-4 w-4" />
                Sign-in gateway
              </div>
              <p className="mt-2 leading-6">
                Continue to your workspace, keep your repo analysis linked, and pick up where the preview left off.
              </p>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-muted">
              {footerLink.text}{" "}
              <Link href={footerLink.href} className="font-semibold text-secondary hover:text-primary">
                {footerLink.label}
              </Link>
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Protected by encrypted session handling
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
