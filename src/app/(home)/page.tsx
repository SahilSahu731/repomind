import { LandingHero } from "@/components/landing/LandingHero";
import {
  LandingAnalyze,
  LandingCTA,
  LandingFlow,
  LandingProof,
} from "@/components/landing/LandingSections";
import {
  LandingFAQ,
  LandingReportShowcase,
  LandingTrust,
  LandingUseCases,
} from "@/components/landing/LandingExpandedSections";
import { LandingMotion } from "@/components/landing/LandingMotion";

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <LandingMotion />
      <LandingHero />
      <LandingProof />
      <LandingReportShowcase />
      <LandingUseCases />
      <LandingFlow />
      <LandingTrust />
      <LandingFAQ />
      <LandingAnalyze />
      <LandingCTA />
    </div>
  );
}
