import {
  ArrowDownRight,
  CircleCheck,
  Code2,
  Compass,
  Eye,
  GitPullRequest,
  Map,
  Plus,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const reportViews = [
  ["01", "Overview"],
  ["02", "Architecture"],
  ["03", "Dependencies"],
  ["04", "Entry points"],
  ["05", "Start guide"],
];

export function LandingReportShowcase() {
  return (
    <section id="report" className="scroll-mt-20 border-b border-[#292721]">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid border-b border-[#292721] lg:grid-cols-[.62fr_1.38fr]">
          <div className="border-[#292721] px-6 py-10 sm:px-10 lg:border-r lg:px-16 lg:py-16 xl:px-20">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Inside the report</p>
            <div className="mt-8 hidden h-24 w-px bg-[#292721]/35 lg:block" />
          </div>
          <div className="px-6 py-10 sm:px-10 lg:px-16 lg:py-16 xl:px-20">
            <h2 className="max-w-[18ch] font-serif text-[clamp(2.7rem,5.2vw,5.6rem)] font-normal leading-[.98] tracking-[-.045em] text-[#292721]">
              One repository. One coherent point of view.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8">
              RepoMind brings structure, relationships, likely entry points, and onboarding guidance into a report built for decisions—not another wall of generated prose.
            </p>
          </div>
        </div>

        <div className="px-4 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20 xl:px-20">
          <div className="overflow-hidden border border-[#292721] bg-[#292721] text-[#f5f0e5] shadow-[0_36px_90px_-60px_rgba(41,39,33,.8)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center bg-[#d75c3f] font-mono text-[9px] text-white">R</span>
                <div>
                  <p className="text-sm font-medium">Repository report</p>
                  <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#aaa398]">Illustrative product view</p>
                </div>
              </div>
              <span className="flex items-center gap-2 border border-white/20 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.14em] text-[#c8c2b7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9aaa91]" />
                Analysis complete
              </span>
            </div>

            <div className="grid lg:grid-cols-[15rem_1fr]">
              <aside className="border-b border-white/20 bg-[#24231f] p-4 lg:border-b-0 lg:border-r lg:p-5">
                <p className="px-3 font-mono text-[8px] uppercase tracking-[.16em] text-[#858176]">Report index</p>
                <nav aria-label="Illustrative report navigation" className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                  {reportViews.map(([number, label], index) => (
                    <div
                      key={number}
                      className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-xs ${index === 1 ? "bg-[#f5f0e5] text-[#292721]" : "text-[#aaa398]"}`}
                    >
                      <span className={`font-mono text-[8px] ${index === 1 ? "text-[#c94f34]" : "text-[#777168]"}`}>{number}</span>
                      {label}
                    </div>
                  ))}
                </nav>
                <div className="mt-8 hidden border-t border-white/15 px-3 pt-5 lg:block">
                  <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#858176]">Input boundary</p>
                  <p className="mt-2 text-xs leading-5 text-[#aaa398]">Public repository<br />Default branch</p>
                </div>
              </aside>

              <div className="bg-[#f5f0e5] p-5 text-[#292721] sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#292721] pb-6">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#6d675f]">Architecture / detected pattern</p>
                    <h3 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">Layered service architecture</h3>
                  </div>
                  <p className="max-w-[18rem] text-xs leading-5 text-[#6d675f]">A structural reading assembled from repository signals and project metadata.</p>
                </div>

                <div className="grid gap-px bg-[#292721] lg:grid-cols-[1.08fr_.92fr]">
                  <div className="bg-[#e8dfcf] p-5 sm:p-7">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">System map</p>
                      <span className="font-mono text-[8px] text-[#777168]">Detected relationships</span>
                    </div>
                    <svg viewBox="0 0 520 260" className="mt-5 w-full" role="img" aria-label="Illustrative repository architecture graph">
                      <g fill="none" stroke="#292721" strokeOpacity=".45" strokeWidth="1.4">
                        <path d="M65 130H168L242 68H350L430 128" />
                        <path d="M168 130 245 200H355L430 128" />
                        <path d="M242 68 245 200M350 68 355 200" />
                      </g>
                      <g stroke="#292721" strokeWidth="1.4">
                        <circle cx="65" cy="130" r="24" fill="#F5F0E5" />
                        <circle cx="168" cy="130" r="31" fill="#D75C3F" />
                        <circle cx="242" cy="68" r="20" fill="#F5F0E5" />
                        <circle cx="245" cy="200" r="23" fill="#809177" />
                        <circle cx="350" cy="68" r="15" fill="#292721" />
                        <circle cx="355" cy="200" r="18" fill="#F5F0E5" />
                        <circle cx="430" cy="128" r="34" fill="#292721" />
                      </g>
                      <g fontFamily="ui-monospace, monospace" fontSize="8" textAnchor="middle" fill="#292721">
                        <text x="65" y="165">ENTRY</text>
                        <text x="168" y="134">ROUTES</text>
                        <text x="242" y="42">AUTH</text>
                        <text x="245" y="234">QUEUE</text>
                      </g>
                      <text x="430" y="132" fill="#F5F0E5" fontFamily="ui-monospace, monospace" fontSize="8" textAnchor="middle">CORE</text>
                    </svg>
                  </div>

                  <div className="bg-[#f7f2e7] p-5 sm:p-7">
                    <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#6d675f]">Suggested first route</p>
                    <ol className="mt-5 divide-y divide-[#292721]/25 border-t border-[#292721]/25">
                      {[
                        ["01", "Find the application entry", "Start where requests enter the system."],
                        ["02", "Trace the service boundary", "Follow orchestration into core modules."],
                        ["03", "Review persistence edges", "See where state enters and leaves."],
                      ].map(([number, title, body]) => (
                        <li key={number} className="grid grid-cols-[2rem_1fr] gap-3 py-4">
                          <span className="font-mono text-[8px] text-[#c94f34]">{number}</span>
                          <div>
                            <p className="text-sm font-medium">{title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#6d675f]">{body}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 border-l-2 border-[#667a60] bg-[#dfe5d8] px-4 py-3">
                      <p className="font-mono text-[8px] uppercase tracking-[.13em] text-[#52664d]">Why this matters</p>
                      <p className="mt-1.5 text-xs leading-5 text-[#43533f]">Connect structure to a practical reading order before making a change.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-right font-mono text-[8px] uppercase tracking-[.14em] text-[#777168]">Representative interface · Actual output varies by repository</p>
        </div>
      </div>
    </section>
  );
}

const useCases = [
  {
    number: "01",
    title: "Joining an unfamiliar project",
    question: "What should I understand before I touch the code?",
    body: "Build a reading route around entry points, core modules, and the relationships that hold the system together.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Planning a change",
    question: "Where is this change likely to travel?",
    body: "Use detected dependency signals and module boundaries to identify the files and layers worth reviewing first.",
    icon: GitPullRequest,
  },
  {
    number: "03",
    title: "Reviewing architecture",
    question: "Does the repository still match its intended shape?",
    body: "Compare the visible structure with the team’s mental model and surface areas that deserve a closer human review.",
    icon: Workflow,
  },
];

export function LandingUseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 border-b border-[#292721]">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid border-b border-[#292721] lg:grid-cols-[.82fr_1.18fr]">
          <div className="border-[#292721] px-6 py-12 sm:px-10 lg:border-r lg:px-16 lg:py-20 xl:px-20">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Built for the moment context matters</p>
            <h2 className="mt-7 max-w-[12ch] font-serif text-[clamp(3rem,5vw,5.8rem)] font-normal leading-[.94] tracking-[-.05em] text-[#292721]">
              Start with a better question.
            </h2>
          </div>
          <div className="flex items-end px-6 py-12 sm:px-10 lg:px-16 lg:py-20 xl:px-20">
            <p className="max-w-2xl text-base leading-7 text-[#5e5952] sm:text-lg sm:leading-8">
              RepoMind is most useful when you have a real decision to make: where to begin, what a change may touch, or which architectural assumption needs verification.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          {useCases.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.number} className={`flex min-h-[30rem] flex-col p-7 sm:p-10 lg:p-12 ${index < 2 ? "border-b border-[#292721] md:border-b-0 md:border-r" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[.16em] text-[#6d675f]">{item.number}</span>
                  <Icon className="h-7 w-7 stroke-[1.35] text-[#d75c3f]" />
                </div>
                <p className="mt-14 font-mono text-[9px] uppercase tracking-[.14em] text-[#667a60]">{item.title}</p>
                <h3 className="mt-5 max-w-[15ch] font-serif text-3xl leading-[1.05] tracking-[-.04em] sm:text-4xl">{item.question}</h3>
                <p className="mt-auto pt-10 text-sm leading-7 text-[#5e5952]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const boundaries = [
  {
    number: "01",
    title: "What RepoMind reads",
    icon: Eye,
    items: ["Public repository structure", "README and project metadata", "Supported manifests and detected imports", "File paths, sizes, and entry-point signals"],
  },
  {
    number: "02",
    title: "What RepoMind creates",
    icon: Map,
    items: ["Architecture and module overview", "Detected dependency relationships", "Likely entry points and hotspots", "A practical onboarding route"],
  },
  {
    number: "03",
    title: "What stays untouched",
    icon: ShieldCheck,
    items: ["No commits or pull requests", "No write access to the repository", "No changes to source code", "No claim to replace human review"],
  },
];

export function LandingTrust() {
  return (
    <section id="trust" className="scroll-mt-20 border-b border-[#292721] bg-[#e8dfcf]">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid border-b border-[#292721] lg:grid-cols-[1.05fr_.95fr]">
          <div className="border-[#292721] px-6 py-14 sm:px-10 lg:border-r lg:px-16 lg:py-20 xl:px-20">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Clear boundaries build useful trust</p>
            <h2 className="mt-7 max-w-[13ch] font-serif text-[clamp(3rem,5vw,5.8rem)] font-normal leading-[.94] tracking-[-.05em] text-[#292721]">
              Understand what the analysis knows—and what it does not.
            </h2>
          </div>
          <div className="flex flex-col justify-end px-6 py-14 sm:px-10 lg:px-16 lg:py-20 xl:px-20">
            <Code2 className="h-8 w-8 stroke-[1.3] text-[#d75c3f]" />
            <p className="mt-8 max-w-lg text-base leading-7 text-[#5e5952]">
              RepoMind begins with deterministic repository signals, then uses AI-assisted synthesis to make those signals easier to navigate. It is an orientation tool—not a runtime trace, formal architecture proof, or security audit.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3">
          {boundaries.map((boundary, index) => {
            const Icon = boundary.icon;
            return (
              <article key={boundary.number} className={`p-7 sm:p-10 lg:p-12 ${index < 2 ? "border-b border-[#292721] lg:border-b-0 lg:border-r" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[.16em] text-[#c94f34]">{boundary.number}</span>
                  <Icon className="h-6 w-6 stroke-[1.4] text-[#667a60]" />
                </div>
                <h3 className="mt-10 font-serif text-3xl tracking-[-.04em]">{boundary.title}</h3>
                <ul className="mt-7 border-t border-[#292721]/30">
                  {boundary.items.map((item) => (
                    <li key={item} className="flex gap-3 border-b border-[#292721]/20 py-3 text-sm leading-6 text-[#5e5952]">
                      <CircleCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-[#d75c3f]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  ["Which repositories can I analyze?", "RepoMind currently supports public GitHub repositories. You can submit the repository URL or a GitHub URL that points to a specific branch."],
  ["Does RepoMind change my repository?", "No. The analysis is read-only: RepoMind does not commit code, open pull requests, or request repository write access."],
  ["What appears in a report?", "Reports combine a structural overview, detected technology and dependency signals, likely entry points, module responsibilities, file context, risks worth reviewing, and an onboarding guide."],
  ["How deep is the analysis?", "Depth varies by repository and language. RepoMind is strongest at structural orientation and detected relationships; its output should guide closer engineering review rather than replace it."],
  ["Is RepoMind a security scanner?", "No. It may highlight structural concerns, but it is not a vulnerability scanner, penetration test, compliance review, or substitute for a dedicated security audit."],
  ["Why do I need an account?", "An account lets RepoMind associate an analysis with your workspace, show progress, and make the completed report available when you return."],
];

export function LandingFAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-[#292721]">
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[.72fr_1.28fr]">
        <div className="border-[#292721] px-6 py-14 sm:px-10 lg:border-r lg:px-16 lg:py-20 xl:px-20">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6d675f]">Questions before the first scan</p>
          <h2 className="mt-7 max-w-[10ch] font-serif text-[clamp(3rem,5vw,5.8rem)] font-normal leading-[.94] tracking-[-.05em] text-[#292721]">
            Clarity should begin here.
          </h2>
          <ArrowDownRight className="mt-10 hidden h-8 w-8 stroke-[1.25] text-[#d75c3f] lg:block" />
        </div>

        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 xl:px-20">
          <div className="border-t border-[#292721]">
            {faqs.map(([question, answer], index) => (
              <details key={question} className="group border-b border-[#292721]">
                <summary className="flex cursor-pointer list-none items-center gap-5 py-6 marker:hidden sm:py-7">
                  <span className="font-mono text-[8px] tracking-[.15em] text-[#c94f34]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-serif text-xl tracking-[-.025em] sm:text-2xl">{question}</span>
                  <Plus className="h-4 w-4 shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-2xl pb-7 pl-10 pr-8 text-sm leading-7 text-[#5e5952] sm:text-base">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
