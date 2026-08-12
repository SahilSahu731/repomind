import type { Metadata } from "next";
import UserWorkspaceLayout from "@/components/UserWorkspaceLayout";

interface UserLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Workspace",
  description: "Your private RepoMind repository workspace.",
  robots: { index: false, follow: false, nocache: true },
};

export default function UserLayout({ children }: UserLayoutProps) {
  return <UserWorkspaceLayout>{children}</UserWorkspaceLayout>;
}
