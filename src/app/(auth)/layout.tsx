import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}

async function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/user/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-330 items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
          <Link href="/" className="text-[1.06rem] font-semibold tracking-tight text-foreground">
            RepoMind Labs
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
