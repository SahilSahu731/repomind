import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0a0a0a] text-[#d4d4d8]">
      <div className="mx-auto w-full max-w-330 px-8 py-16 sm:px-12 sm:py-20 lg:px-24 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-12">
          <section>
            <Link href="/" className="text-base font-semibold tracking-tight text-white">
              RepoMind
            </Link>
            <p className="mt-5 max-w-[36ch] text-sm leading-7 text-zinc-400">
              Repository intelligence for product and engineering teams. Analyze structure,
              uncover risk, and onboard faster.
            </p>
            <p className="mt-7 text-xs uppercase tracking-[0.12em] text-zinc-500">
              Built for serious teams
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Product</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-zinc-400">
              <li>
                <Link href="/#try" className="transition hover:text-white">Analyze Repo</Link>
              </li>
              <li>
                <Link href="/#flow" className="transition hover:text-white">How It Works</Link>
              </li>
              <li>
                <Link href="/user/dashboard" className="transition hover:text-white">Workspace</Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Resources</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-zinc-400">
              <li>
                <Link href="/signup" className="transition hover:text-white">Get Started</Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-white">Sign In</Link>
              </li>
              <li>
                <Link href="/api/health" className="transition hover:text-white">System Status</Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Company</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-zinc-400">
              <li>
                <Link href="#" className="transition hover:text-white">About</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-white">Contact</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-white">Privacy</Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">© 2026 RepoMind. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-zinc-500">
            <Link href="#" className="transition hover:text-zinc-300">Terms</Link>
            <Link href="#" className="transition hover:text-zinc-300">Privacy</Link>
            <Link href="#" className="transition hover:text-zinc-300">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
