import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UserWorkspaceLayout from "@/components/UserWorkspaceLayout";
import { authOptions } from "@/lib/auth";

interface UserLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Workspace",
  description: "Your private RepoMind repository workspace.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function UserLayout({ children }: UserLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/user/dashboard");
  }

  return <UserWorkspaceLayout>{children}</UserWorkspaceLayout>;
}
