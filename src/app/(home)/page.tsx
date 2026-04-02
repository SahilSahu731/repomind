import { LandingCTA, LandingFeatures, LandingSegments, LandingWorkflow } from "@/components/landing/LandingSections";
import { LandingHero } from "@/components/landing/LandingHero";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.08)_0%,transparent_35%),radial-gradient(circle_at_top_right,rgba(246,193,119,0.08)_0%,transparent_30%),var(--background)] text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="float-slow absolute left-[-8rem] top-[-7rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="float-slow absolute right-[-8rem] top-[18rem] h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="float-slow absolute bottom-[-9rem] left-[22%] h-80 w-80 rounded-full bg-[#818cf8]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto w-full max-w-[1320px] px-6 pb-24 sm:px-10 lg:px-20 lg:pb-32">
        <LandingHero />
        <LandingSegments />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingCTA />
      </main>
    </div>
  );
}
