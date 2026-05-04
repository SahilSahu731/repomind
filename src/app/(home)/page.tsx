
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCTA, LandingFlow, LandingProof } from "@/components/landing/LandingSections";
import { RepoAnalyzeBar } from "@/components/landing/RepoAnalyzeBar";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <section
        id="try"
        className="relative border-b border-border px-6 pb-12 pt-14 sm:px-10 sm:pt-18 lg:px-16 lg:pt-22"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(34,211,238,0.12),transparent_36%),radial-gradient(circle_at_88%_0%,rgba(244,63,94,0.16),transparent_42%),linear-gradient(180deg,rgba(15,17,23,0.7)_0%,rgba(11,12,16,0.96)_90%)]" />
        <div className="relative mx-auto max-w-280">
          <p className="reveal mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Analyze Any Public GitHub Repository
          </p>
          <RepoAnalyzeBar />
        </div>
      </section>

      <LandingHero />

      <div className="mx-auto w-full max-w-280 px-6 sm:px-10 lg:px-16">
        <LandingProof />
        <LandingFlow />
        <LandingCTA />
      </div>
    </div>
  );
}