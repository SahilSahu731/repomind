import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
    <main className="bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-140 items-center justify-center">
        <section className="w-full rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="mb-8">
            <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
              RepoMind Labs
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-[52ch] text-sm leading-7 text-muted">{subtitle}</p>
          </div>

          {children}

          <p className="mt-6 text-center text-sm text-muted">
            {footerLink.text}{" "}
            <Link href={footerLink.href} className="font-semibold text-foreground hover:opacity-80">
              {footerLink.label}
            </Link>
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted">
            <ShieldCheck className="h-4 w-4" />
            Protected session handling
          </div>
        </section>
      </div>
    </main>
  );
}
