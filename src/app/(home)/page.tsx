import { LandingHero } from "@/components/landing/LandingHero";
import {
  LandingAnalyze,
  LandingCTA,
  LandingFlow,
  LandingProof,
} from "@/components/landing/LandingSections";

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <LandingHero />
      <LandingProof />
      <LandingFlow />
      <LandingAnalyze />
      <LandingCTA />
    </div>
  );
}
