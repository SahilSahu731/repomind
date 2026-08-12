import type { Metadata } from "next";
import { StatusDashboard } from "@/components/status/StatusDashboard";

export const metadata: Metadata = {
  title: "System Status",
  description: "Live operational health for RepoMind storage, analysis, and API protection services.",
  alternates: { canonical: "/status" },
};

export default function StatusPage() {
  return <StatusDashboard />;
}
