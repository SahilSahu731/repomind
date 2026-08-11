import Link from "next/link";
import { ArrowRight, Boxes, GitBranch, Route, ScanSearch } from "lucide-react";
import { RepoAnalyzeBar } from "./RepoAnalyzeBar";

const capabilities = [
  {
    number: "01",
    title: "See the system, not just its files.",
    body: "RepoMind groups the repository into architectural layers and modules, then explains what each part is responsible for.",
    icon: Boxes,
    detail: "Architecture map",
    signals: ["Module boundaries", "Layer responsibilities", "Data-flow summary"],
  },
  {
    number: "02",
    title: "Follow the connections the repository exposes.",
    body: "Detected internal relationships reveal high-connectivity files, likely coupling, entry points, and change surfaces worth reviewing.",
    icon: GitBranch,
    detail: "Dependency graph",
    signals: ["Internal imports", "Connectivity signals", "Likely hotspots"],
  },
  {
    number: "03",
    title: "Know where to begin.",
    body: "A project-aware start guide turns an unfamiliar codebase into an ordered reading path for engineers joining the work.",
    icon: Route,
    detail: "Onboarding guide",
    signals: ["Ordered reading path", "Suggested first files", "Project-aware context"],
  },
  {
    number: "04",
    title: "Find the friction hiding in plain sight.",
    body: "Repository signals are translated into maintainability findings, architecture issues, and a contribution-readiness score.",
    icon: ScanSearch,
    detail: "Risk and readiness",
    signals: ["Structural concerns", "Contribution signals", "Human review prompts"],
  },
];

function CapabilityVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="capability-visual" aria-hidden="true">
        <div className="absolute inset-0 marketing-grid opacity-55" />
        <div className="relative grid h-full grid-cols-[.8fr_1.2fr] items-center gap-5 p-5 sm:p-6">
          <div className="space-y-2 font-mono text-[8px] uppercase tracking-[.13em] text-[#6d675f]">
            {["Interface", "Services", "Data"].map((layer, layerIndex) => (
              <div key={layer} className="capability-layer flex items-center justify-between border border-[#292721]/35 bg-[#f7f2e7]/90 px-3 py-2" style={{ animationDelay: `${layerIndex * 180}ms` }}>
                <span>{layer}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${layerIndex === 1 ? "bg-[#d75c3f]" : "bg-[#809177]"}`} />
              </div>
            ))}
          </div>
          <svg viewBox="0 0 240 130" className="w-full">
            <g fill="none" stroke="#292721" strokeOpacity=".42" strokeWidth="1.2">
              <path className="motion-dash" d="M26 64H88L127 29H205" />
              <path className="motion-dash" d="M88 64 129 102H205" />
              <path d="M127 29 129 102" />
            </g>
            <circle cx="26" cy="64" r="13" fill="#D75C3F" />
            <circle cx="88" cy="64" r="18" fill="#292721" />
            <circle className="motion-node" cx="127" cy="29" r="10" fill="#809177" />
            <circle cx="129" cy="102" r="12" fill="#F5F0E5" stroke="#292721" />
            <circle cx="205" cy="29" r="14" fill="#F5F0E5" stroke="#292721" />
            <circle className="motion-node motion-node-delay" cx="205" cy="102" r="9" fill="#D75C3F" />
          </svg>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="capability-visual bg-[#292721]" aria-hidden="true">
        <div className="absolute left-5 top-4 font-mono text-[8px] uppercase tracking-[.14em] text-[#858176]">Detected graph</div>
        <div className="absolute right-5 top-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#aaa398]">
          <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[#9aaa91]" /> Live signal
        </div>
        <svg viewBox="0 0 520 170" className="absolute inset-x-0 bottom-0 w-full">
          <g fill="none" stroke="#A9A398" strokeOpacity=".42" strokeWidth="1.2">
            <path className="motion-dash-light" d="M45 102 142 61 239 92 350 42 468 88" />
            <path className="motion-dash-light" d="M142 61 175 137 239 92 337 139 468 88" />
            <path d="M45 102 175 137M350 42 337 139" />
          </g>
          <circle cx="45" cy="102" r="17" fill="#D75C3F" />
          <circle className="motion-node" cx="142" cy="61" r="10" fill="#F5F0E5" />
          <circle cx="175" cy="137" r="13" fill="#809177" />
          <circle cx="239" cy="92" r="24" fill="#F5F0E5" />
          <circle className="motion-node motion-node-delay" cx="350" cy="42" r="12" fill="#809177" />
          <circle cx="337" cy="139" r="15" fill="#D75C3F" />
          <circle cx="468" cy="88" r="19" fill="#F5F0E5" />
          <g fill="#292721" fontFamily="ui-monospace, monospace" fontSize="7" textAnchor="middle">
            <text x="45" y="105">API</text>
            <text x="239" y="95">CORE</text>
            <text x="468" y="91">UI</text>
          </g>
        </svg>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="capability-visual" aria-hidden="true">
        <div className="absolute bottom-5 left-8 top-5 w-px bg-[#292721]/35" />
        <div className="relative grid h-full content-center gap-3 px-5 py-4 sm:px-8">
          {[
            ["01", "Application entry", "Begin here"],
            ["02", "Request boundary", "Then trace"],
            ["03", "Core service", "Build context"],
          ].map(([number, title, state], routeIndex) => (
            <div key={number} className="group/route relative grid grid-cols-[1.5rem_1fr_auto] items-center gap-3">
              <span className={`relative z-10 grid h-5 w-5 place-items-center rounded-full border border-[#292721] font-mono text-[7px] ${routeIndex === 0 ? "route-pulse bg-[#d75c3f] text-white" : "bg-[#f5f0e5]"}`}>{number}</span>
              <span className="text-xs font-medium text-[#292721] sm:text-sm">{title}</span>
              <span className="font-mono text-[7px] uppercase tracking-[.12em] text-[#777168]">{state}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="capability-visual overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 marketing-grid opacity-45" />
      <div className="scan-beam absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#d75c3f]/18 to-transparent" />
      <div className="relative grid h-full grid-cols-[.8fr_1.2fr] items-center gap-6 p-5 sm:p-6">
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#292721]/35">
          <div className="scan-orbit absolute inset-2 rounded-full border border-dashed border-[#d75c3f]/65" />
          <ScanSearch className="h-7 w-7 stroke-[1.25] text-[#292721]" />
          <span className="absolute -right-1 top-4 h-2.5 w-2.5 rounded-full bg-[#d75c3f]" />
        </div>
        <div className="space-y-3">
          {[["Structure", "w-[78%]"], ["Coupling", "w-[58%]"], ["Readiness", "w-[86%]"]].map(([label, width], signalIndex) => (
            <div key={label}>
              <div className="flex justify-between font-mono text-[7px] uppercase tracking-[.12em] text-[#6d675f]"><span>{label}</span><span>Signal</span></div>
              <div className="mt-1.5 h-1 bg-[#292721]/12"><div className={`signal-grow h-full bg-[#809177] ${width}`} style={{ animationDelay: `${signalIndex * 220}ms` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyzePipelineVisual() {
  return (
    <div className="relative mb-7 border-y border-[#292721]/30 py-5" aria-hidden="true">
      <svg viewBox="0 0 640 96" className="w-full">
        <path className="motion-dash" d="M62 48H578" stroke="#292721" strokeOpacity=".42" strokeWidth="1.2" />
        <g>
          <circle cx="62" cy="48" r="23" fill="#F7F2E7" stroke="#292721" />
          <circle className="pipeline-pulse" cx="320" cy="48" r="27" fill="#D75C3F" stroke="#292721" />
          <circle cx="578" cy="48" r="23" fill="#292721" />
        </g>
        <g fontFamily="ui-monospace, monospace" fontSize="8" textAnchor="middle">
          <text x="62" y="52" fill="#292721">URL</text>
          <text x="320" y="52" fill="#292721">MAP</text>
          <text x="578" y="52" fill="#F5F0E5">REPORT</text>
        </g>
        <g fill="#6D675F" fontFamily="ui-monospace, monospace" fontSize="7" textAnchor="middle" letterSpacing="1">
          <text x="62" y="88">INPUT</text>
          <text x="320" y="88">ANALYZE</text>
          <text x="578" y="88">ORIENT</text>
        </g>
      </svg>
    </div>
  );
}

export function LandingProof() {
  return (
    <section id="product" className="scroll-mt-20 border-b border-[#292721]">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid border-b border-[#292721] lg:grid-cols-[.62fr_1.38fr]">
          <div className="border-[#292721] px-6 py-10 sm:px-10 lg:border-r lg:px-16 lg:py-16 xl:px-20">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">What RepoMind reveals</p>
          </div>
          <div className="px-6 py-10 sm:px-10 lg:px-16 lg:py-16 xl:px-20">
            <h2 className="max-w-[17ch] font-serif text-[clamp(2.7rem,5.2vw,5.6rem)] font-normal leading-[.98] tracking-[-.045em] text-[#292721]">
              Complexity becomes useful when it has a shape.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8">
              A repository contains more than source code. It contains decisions, boundaries, dependencies,
              and the path a new contributor must discover. RepoMind makes that hidden system visible.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                data-scroll-reveal
                data-reveal-order={index % 2}
                className={`capability-card group relative min-h-[34rem] overflow-hidden border-[#292721] p-6 transition-[background-color,transform] duration-500 hover:bg-[#ebe4d4] focus-within:bg-[#ebe4d4] sm:p-10 lg:p-12 xl:p-14 ${
                  index % 2 === 0 ? "md:border-r" : ""
                } ${index < 3 ? "border-b" : ""} ${index === 2 ? "md:border-b-0" : ""} ${index === 1 || index === 2 ? "bg-[#f7f2e7]/40" : ""}`}
              >
                <span className="capability-accent absolute left-0 top-0 h-1 bg-[#d75c3f]" />
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] tracking-[.16em] text-[#6d675f]">{item.number}</span>
                  <Icon className="h-8 w-8 stroke-[1.35] text-[#d75c3f] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3 group-focus-within:-translate-y-1" />
                </div>
                <h3 className="mt-10 max-w-[17ch] font-serif text-3xl leading-[1.05] tracking-[-.035em] text-[#292721] sm:text-4xl">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#5e5952] sm:text-base">{item.body}</p>
                <div className="mt-7">
                  <CapabilityVisual index={index} />
                </div>
                <ul className="mt-7 grid gap-2 border-t border-[#292721]/25 pt-5 text-xs text-[#6d675f] sm:grid-cols-3">
                  {item.signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#d75c3f]" />
                      {signal}
                    </li>
                  ))}
                </ul>
                <p className="mt-7 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#6d675f]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7b8f72]" />
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingFlow() {
  return (
    <section id="workflow" className="scroll-mt-20 border-b border-[#292721] bg-[#292721] text-[#f4efe4]">
      <div className="mx-auto max-w-[90rem] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-20">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#aaa398]">From link to understanding</p>
            <h2 className="mt-7 max-w-[11ch] font-serif text-[clamp(3rem,5.5vw,6rem)] font-normal leading-[.94] tracking-[-.045em]">
              A clearer first hour with any codebase.
            </h2>
          </div>

          <ol className="border-t border-white/25">
            {[
              ["01", "INPUT", "Paste a public GitHub URL", "Choose a repository and, when needed, the branch you want RepoMind to inspect."],
              ["02", "STRUCTURE", "RepoMind builds the map", "The analysis pipeline reads structure, detects technologies and entry points, and resolves supported internal dependencies."],
              ["03", "SYNTHESIS", "AI turns signals into context", "Repository signals become architecture explanations, review prompts, file context, and an onboarding sequence."],
              ["04", "REPORT", "Review one structured workspace", "Move from the overview into modules, dependencies, entry points, file intelligence, and a practical start guide."],
            ].map(([number, stage, title, body]) => (
              <li key={number} className="grid gap-4 border-b border-white/25 py-7 sm:grid-cols-[4rem_1fr] sm:gap-7">
                <span className="font-mono text-[10px] tracking-[.16em] text-[#d97757]">{number}</span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-lg font-medium tracking-[-.02em] sm:text-xl">{title}</h3>
                    <span className="font-mono text-[8px] tracking-[.15em] text-[#858176]">{stage}</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#bdb7ac]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-[#aaa398]">
          <span>Deterministic repository signals first</span>
          <span className="text-[#d97757]">AI-assisted synthesis second</span>
        </div>
      </div>
    </section>
  );
}

export function LandingAnalyze() {
  return (
    <section id="analyze" className="scroll-mt-20 border-b border-[#292721]">
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[.78fr_1.22fr]">
        <div data-scroll-reveal className="border-[#292721] px-6 py-16 sm:px-10 lg:border-r lg:px-16 lg:py-20 xl:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Start with one repository</p>
          <h2 className="mt-7 max-w-[10ch] font-serif text-[clamp(3rem,5vw,5.8rem)] font-normal leading-[.94] tracking-[-.05em] text-[#292721]">
            See what your code is trying to tell you.
          </h2>
          <p className="mt-7 max-w-md text-base leading-7 text-[#5e5952]">
            Public repositories are supported today. Sign in or create an account to start an analysis and keep the result in your workspace.
          </p>
          <ol className="relative mt-8 border-t border-[#292721]/30">
            {[
              ["01", "Submit the repository"],
              ["02", "Follow progress in your workspace"],
              ["03", "Return to the completed report"],
            ].map(([number, label]) => (
              <li key={number} className="group/step flex items-center gap-4 border-b border-[#292721]/20 py-3 text-sm text-[#5e5952]">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[#292721]/30 bg-[#f5f0e5] font-mono text-[7px] text-[#c94f34] transition-colors group-hover/step:border-[#d75c3f] group-hover/step:bg-[#ead8cf]">{number}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
        <div className="relative flex min-h-[46rem] items-center overflow-hidden bg-[#eae2d2] px-6 py-14 sm:px-10 lg:px-14 lg:py-16 xl:px-20">
          <div className="marketing-grid pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute -right-8 -top-20 font-serif text-[20rem] leading-none text-[#d75c3f]/8" aria-hidden="true">01</div>
          <svg className="pointer-events-none absolute inset-x-0 -top-4 h-48 w-full opacity-[.12]" viewBox="0 0 820 280" aria-hidden="true">
            <g fill="none" stroke="#292721" strokeWidth="1.2">
              <path className="motion-dash" d="M-20 158 150 88 292 142 474 54 658 128 850 42" />
              <path d="M150 88 216 238 292 142 512 230 658 128" />
            </g>
            <g fill="#D75C3F">
              <circle cx="150" cy="88" r="7" />
              <circle className="motion-node" cx="292" cy="142" r="10" />
              <circle cx="474" cy="54" r="6" />
              <circle className="motion-node motion-node-delay" cx="658" cy="128" r="8" />
            </g>
          </svg>

          <div data-scroll-reveal className="relative mx-auto w-full max-w-[48rem]">
            <div className="mb-5 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">
              <span>Analysis intake / 01</span>
              <span className="flex items-center gap-2"><span className="status-pulse h-1.5 w-1.5 rounded-full bg-[#6f8666]" /> Workspace ready</span>
            </div>
            <AnalyzePipelineVisual />
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 border border-[#292721]/25 bg-[#ddd2be]" />
              <div className="pointer-events-none absolute inset-0 translate-x-1.5 translate-y-1.5 border border-[#292721]/30 bg-[#e5dbc8]" />
              <div className="relative"><RepoAnalyzeBar /></div>
            </div>
            <div className="mt-8 grid grid-cols-3 border-y border-[#292721]/25 py-4 text-center">
              {[["READ", "Structure"], ["TRACE", "Relations"], ["EXPLAIN", "Context"]].map(([verb, noun]) => (
                <div key={verb}>
                  <p className="font-mono text-[7px] tracking-[.15em] text-[#c94f34]">{verb}</p>
                  <p className="mt-1 text-[11px] text-[#6d675f] sm:text-xs">{noun}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-[#d75c3f] text-[#201f1b]">
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[1.15fr_.85fr]">
        <div className="border-[#201f1b] px-6 py-16 sm:px-10 lg:border-r lg:px-16 lg:py-24 xl:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[.18em]">Early access, clearly stated</p>
          <h2 className="mt-7 max-w-[12ch] font-serif text-[clamp(3.2rem,6vw,6.5rem)] font-normal leading-[.9] tracking-[-.05em]">
            Begin with clarity. Keep it as you grow.
          </h2>
        </div>
        <div className="flex flex-col justify-between px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div>
            <p className="text-lg leading-8">
              New accounts currently begin with three repository-analysis credits. Paid access and team plans are being prepared; no card is required to explore RepoMind today.
            </p>
            <div className="mt-8 grid grid-cols-3 border-y border-[#201f1b]/40 py-5">
              {[["01", "Free account"], ["02", "3 credits"], ["03", "No card"]].map(([number, label]) => (
                <div key={number}>
                  <p className="font-mono text-[8px] tracking-[.15em]">{number}</p>
                  <p className="mt-1.5 text-xs sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/signup"
            className="group mt-12 inline-flex h-14 w-fit items-center gap-4 rounded-full bg-[#201f1b] px-7 text-sm font-medium text-[#f4efe4] transition hover:bg-[#f4efe4] hover:text-[#201f1b]"
          >
            Create your account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
