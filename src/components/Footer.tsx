import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto w-full max-w-330 px-6 py-10 sm:px-10 lg:px-20">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.6rem] border border-border bg-[linear-gradient(160deg,var(--surface-2)_0%,var(--surface)_100%)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">RepoMind Labs</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Build a shared model of a codebase in minutes.
            </h2>
            <p className="mt-3 max-w-[50ch] text-sm leading-7 text-muted">
              Analyze repositories, highlight architectural risk, and hand your team an onboarding path that actually feels clean.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-border bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">Product</p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li><Link href="/#features" className="transition hover:text-foreground">Features</Link></li>
                <li><Link href="/#workflow" className="transition hover:text-foreground">Workflow</Link></li>
                <li><Link href="/#pricing" className="transition hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>

            <div className="rounded-[1.6rem] border border-border bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">Company</p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li><Link href="#" className="transition hover:text-foreground">About</Link></li>
                <li><Link href="#" className="transition hover:text-foreground">Contact</Link></li>
                <li><Link href="/login" className="transition hover:text-foreground">Sign in</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© 2024 RepoMind Labs. All rights reserved.</p>
          <p className="text-xs text-muted">Dark workspace-first preview built for repository analysis.</p>
        </div>
      </div>
    </footer>
  );
}
