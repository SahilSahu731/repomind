import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Data Controls",
  description: "Export, retention, correction, and deletion controls for RepoMind accounts and reports.",
  alternates: { canonical: "/data-controls" },
};

export default function DataControlsPage() {
  return (
    <LegalPage
      eyebrow="Trust / Data controls"
      title="Your workspace stays yours."
      introduction="A practical account of what is temporary, what remains in your workspace, and how to export or remove it."
      updated="August 11, 2026"
      sections={[
        {
          title: "Temporary source copies",
          body: [
            "A public repository is cloned into isolated temporary storage for analysis. The working copy is deleted after the analysis succeeds or fails. RepoMind stores the resulting report and repository metadata, not a permanent source-code mirror.",
          ],
        },
        {
          title: "Saved workspace data",
          items: [
            "Your account identity and current plan or credit balance.",
            "Submitted repository URL, owner, name, branch, analysis state, and timestamps.",
            "Generated architecture, dependency, onboarding, technology, file-summary, and readiness results.",
          ],
        },
        {
          title: "Export",
          body: [
            "Signed-in users can download a JSON snapshot from Settings. The export includes the account overview, repository index, and workspace activity currently available to the product.",
          ],
        },
        {
          title: "Correction and deletion",
          body: [
            "Use the Support page to request correction or deletion. Include the email address associated with the account and never include a password, OAuth token, API key, or other secret. RepoMind may ask you to verify control of the account before deleting records.",
            "A verified account-deletion request covers the RepoMind account record, saved repository records, jobs, and generated reports. Third-party providers may retain limited security, billing, or backup records where legally or operationally required.",
          ],
        },
        {
          title: "What signing out does",
          body: [
            "Signing out ends the browser session. It does not delete the account or its saved reports. Clearing browser storage removes local interface preferences, not server-side workspace data.",
          ],
        },
      ]}
    />
  );
}
