import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RepoMind collects, uses, stores, and protects account and repository analysis data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Trust / Privacy"
      title="Privacy, without the fog."
      introduction="This policy explains what RepoMind processes when you create an account or analyze a public GitHub repository. It is written to describe the product as it operates today."
      updated="August 11, 2026"
      sections={[
        {
          title: "Information we collect",
          items: [
            "Account identifiers such as your name, email address, avatar, and GitHub username when available.",
            "Repository URLs, selected branches, job status, generated reports, usage credits, and workspace activity.",
            "Essential technical information needed for security and reliability, such as request timing, error details, and rate-limit identifiers.",
          ],
        },
        {
          title: "How repository analysis works",
          body: [
            "RepoMind currently analyzes public GitHub repositories. It clones a temporary read-only snapshot, inspects its structure and dependencies, stores the generated report in your workspace, and removes the temporary working copy after processing.",
            "RepoMind does not commit to, push to, or modify the repository it analyzes.",
          ],
        },
        {
          title: "Why we use the data",
          items: [
            "Provide authentication, repository analysis, reports, workspace history, and credit accounting.",
            "Protect the service from abuse and investigate failures.",
            "Improve reliability using aggregated operational signals and error reports.",
          ],
        },
        {
          title: "Service providers",
          body: [
            "Depending on deployment configuration, RepoMind may use GitHub for repository access and sign-in, Supabase for authentication and storage, Redis or Upstash for queues and rate limiting, Google Gemini for report generation, and Sentry for error monitoring. These providers process only the information needed to deliver their part of the service under their own terms.",
          ],
        },
        {
          title: "Retention and security",
          body: [
            "Account records and saved reports are retained while your workspace is active or until they are removed through an operational cleanup or verified deletion request. Temporary repository clones are removed after a job completes or fails. No internet service can promise absolute security, but RepoMind uses access controls, restricted server credentials, and encrypted transport in production.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "You may export your current workspace from Settings. You may also request correction or deletion of your account and saved reports through the support process described on the Data controls page. Identity verification may be required before a destructive request is completed.",
          ],
        },
        {
          title: "Policy changes",
          body: [
            "Material changes will be reflected on this page with a revised effective date. Continued use after a change means the updated policy applies to future use.",
          ],
        },
      ]}
    />
  );
}
