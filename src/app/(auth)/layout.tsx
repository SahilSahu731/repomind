import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowUpLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Account access",
  description: "Sign in or create a RepoMind workspace to analyze public GitHub repositories.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}

async function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/user/dashboard");
  }

  return (
    <div className="marketing-theme h-svh overflow-hidden bg-[#f5f0e5] text-[#292721]">
      <a
        href="#auth-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[#292721] px-5 py-3 text-sm font-medium text-[#f5f0e5] transition focus:translate-y-0"
      >
        Skip to form
      </a>
      <header className="relative z-50 h-16 border-b border-[#292721] bg-[#f5f0e5]/95 backdrop-blur-md lg:h-20">
        <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-5 sm:px-10 lg:px-16 xl:px-20">
          <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-[-.025em]">
            <BrandMark className="h-7 w-7 text-[#d75c3f]" />
            RepoMind
          </Link>
          <Link
            href="/"
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#292721] px-4 text-xs font-medium transition hover:bg-[#292721] hover:text-[#f5f0e5] sm:h-11 sm:px-5 sm:text-sm"
          >
            <ArrowUpLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
            Back home
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
