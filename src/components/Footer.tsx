import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#ede0ce] bg-white/50 backdrop-blur">
      <div className="mx-auto flex w-full max-w-330 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-[#201912]">
              RepoMind <span className="text-[#8f7458]">Labs</span>
            </p>
            <p className="mt-2 text-xs text-[#7a6d5f]">
              Understand codebases faster, with structure and context.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#201912]">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#7a6d5f]">
              <li>
                <Link href="/#features" className="transition hover:text-[#201912]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="transition hover:text-[#201912]">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#201912]">
              Company
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#7a6d5f]">
              <li>
                <Link href="#" className="transition hover:text-[#201912]">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-[#201912]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#ede0ce] pt-6">
          <p className="text-xs text-[#7a6d5f]">
            © 2024 RepoMind Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
