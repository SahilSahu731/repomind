import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern access to and use of RepoMind.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Trust / Terms"
      title="Clear terms for careful work."
      introduction="These terms govern your use of RepoMind. By using the service, you agree to use it responsibly and only with repositories you are permitted to inspect."
      updated="August 11, 2026"
      sections={[
        {
          title: "The service",
          body: [
            "RepoMind produces automated explanations, architecture maps, dependency signals, and onboarding guidance for public software repositories. Results are informational aids and may be incomplete, outdated, or incorrect.",
          ],
        },
        {
          title: "Your responsibilities",
          items: [
            "Use the service lawfully and respect repository licenses, intellectual-property rights, and platform terms.",
            "Do not attempt to bypass limits, disrupt workers, probe other users’ workspaces, or submit malicious repositories.",
            "Review generated findings before relying on them for security, compliance, production changes, or other consequential decisions.",
          ],
        },
        {
          title: "Accounts and access",
          body: [
            "You are responsible for activity under your account and for keeping access credentials secure. RepoMind may suspend access needed to protect users, infrastructure, or third parties from abuse.",
          ],
        },
        {
          title: "Credits and future paid plans",
          body: [
            "Current credits represent analysis access, not stored monetary value. Paid checkout, recurring subscriptions, renewals, refunds, and invoices are not offered until they are explicitly enabled in the product with their applicable commercial terms.",
          ],
        },
        {
          title: "Availability and changes",
          body: [
            "The service may change, pause, or discontinue features, and analysis may fail because of repository size, provider availability, rate limits, or unsupported content. Reasonable efforts are made to preserve workspace data, but uninterrupted availability is not guaranteed.",
          ],
        },
        {
          title: "Disclaimer and liability",
          body: [
            "RepoMind is provided on an as-available basis without warranties to the extent permitted by law. To the extent permitted by law, RepoMind is not liable for indirect, incidental, or consequential loss resulting from use of generated analysis.",
          ],
        },
        {
          title: "Contact",
          body: [
            "Questions about these terms can be submitted through the Support page. If a provision cannot be enforced, the remaining provisions continue to apply.",
          ],
        },
      ]}
    />
  );
}
