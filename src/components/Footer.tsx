import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer id="footer" className="bg-[#1f1e1a] text-[#eee9de]">
      <div className="mx-auto max-w-[90rem] px-6 pb-8 pt-16 sm:px-10 lg:px-16 lg:pt-20 xl:px-20">
        <div className="grid gap-14 border-b border-white/20 pb-16 md:grid-cols-2 lg:grid-cols-[1.35fr_.65fr_.65fr_.65fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold tracking-[-.025em]">
              <BrandMark className="h-8 w-8 text-[#d97757]" />
              RepoMind
            </Link>
            <p className="mt-6 max-w-md font-serif text-3xl leading-[1.12] tracking-[-.03em] text-[#eee9de] sm:text-4xl">
              Make an unfamiliar codebase feel navigable.
            </p>
          </div>

          <div>
            <h2 className="font-mono text-[9px] uppercase tracking-[.18em] text-[#918c83]">Explore</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-[#c9c3b8]">
              <li><Link href="/#product" className="transition hover:text-white">Product</Link></li>
              <li><Link href="/#report" className="transition hover:text-white">Inside the report</Link></li>
              <li><Link href="/#workflow" className="transition hover:text-white">How it works</Link></li>
              <li><Link href="/trust" className="transition hover:text-white">Analysis boundaries</Link></li>
              <li><Link href="/#faq" className="transition hover:text-white">FAQ</Link></li>
              <li><Link href="/#analyze" className="transition hover:text-white">Analyze a repository</Link></li>
              <li><Link href="/about" className="transition hover:text-white">About</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-[9px] uppercase tracking-[.18em] text-[#918c83]">Workspace</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-[#c9c3b8]">
              <li><Link href="/signup" className="transition hover:text-white">Create account</Link></li>
              <li><Link href="/login" className="transition hover:text-white">Sign in</Link></li>
              <li><Link href="/user/dashboard" className="inline-flex items-center gap-1.5 transition hover:text-white">Dashboard <ArrowUpRight className="h-3 w-3" /></Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-[9px] uppercase tracking-[.18em] text-[#918c83]">Trust</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-[#c9c3b8]">
              <li><Link href="/privacy" className="transition hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white">Terms</Link></li>
              <li><Link href="/data-controls" className="transition hover:text-white">Data controls</Link></li>
              <li><Link href="/support" className="transition hover:text-white">Support</Link></li>
              <li><Link href="/status" className="transition hover:text-white">System status</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-[#918c83] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RepoMind. Repository intelligence for engineering teams.</p>
          <p>
            Built by{" "}
            <a href={siteConfig.links.creator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#c9c3b8] underline decoration-[#d97757] underline-offset-4 transition hover:text-white">
              Sahil Sahu <ArrowUpRight className="h-3 w-3" />
            </a>
          </p>
          <p>Public GitHub repositories only.</p>
        </div>
      </div>
    </footer>
  );
}
