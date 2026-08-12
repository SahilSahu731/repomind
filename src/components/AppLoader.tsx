import { BrandMark } from "@/components/BrandMark";

export function AppLoader({ label = "Mapping your next view" }: { label?: string }) {
  return (
    <div
      className="marketing-theme relative grid min-h-svh place-items-center overflow-hidden bg-[#f5f0e5] px-6 text-[#292721]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div aria-hidden className="marketing-grid absolute inset-0 opacity-70" />
      <div aria-hidden className="loader-orbit absolute h-[28rem] w-[28rem] rounded-full border border-[#292721]/15 sm:h-[38rem] sm:w-[38rem]" />
      <div aria-hidden className="absolute h-[18rem] w-[18rem] rounded-full border border-[#292721]/10 sm:h-[25rem] sm:w-[25rem]" />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="loader-mark relative grid h-24 w-24 place-items-center rounded-full border border-[#292721] bg-[#f7f2e7] shadow-[0_18px_50px_rgba(41,39,33,.12)]">
          <span aria-hidden className="loader-halo absolute inset-[-1px] rounded-full border border-[#d75c3f]" />
          <BrandMark className="h-10 w-10 text-[#d75c3f]" />
        </div>

        <p className="mt-9 font-mono text-[9px] uppercase tracking-[.2em] text-[#c94f34]">
          RepoMind / Working
        </p>
        <p className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">{label}</p>

        <div aria-hidden className="mt-8 flex w-full items-center gap-3">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#292721]" />
          <span className="relative h-px flex-1 overflow-hidden bg-[#292721]/25">
            <span className="loader-track absolute inset-y-0 w-2/5 bg-[#d75c3f]" />
          </span>
          <span className="loader-node h-1.5 w-1.5 shrink-0 rounded-full bg-[#667a60]" />
        </div>

        <span className="sr-only">Please wait.</span>
      </div>
    </div>
  );
}
