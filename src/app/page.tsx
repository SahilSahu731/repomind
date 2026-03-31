export default function Home() {
  const segments = [
    {
      title: "Architecture Lens",
      detail:
        "Visual module map with boundaries, ownership hints, and probable coupling risks.",
      accent: "from-[#f6d7b8] to-[#f4b782]",
    },
    {
      title: "Dependency Topology",
      detail:
        "Interactive relationship graph to expose hotspots, dead zones, and import gravity.",
      accent: "from-[#c8e8df] to-[#88ccb5]",
    },
    {
      title: "Onboarding Route",
      detail:
        "A practical first-day reading path with exact files and why they matter.",
      accent: "from-[#d9dcf8] to-[#aeb8f2]",
    },
    {
      title: "Risk Radar",
      detail:
        "Flags fragile zones and architecture debt patterns before you touch production code.",
      accent: "from-[#f2cec3] to-[#ea9f8e]",
    },
  ];

  const timeline = [
    {
      step: "01",
      title: "Paste Repository URL",
      text: "Drop any public GitHub repo and choose a branch if needed.",
    },
    {
      step: "02",
      title: "Live Analysis Pipeline",
      text: "Cloning, parsing, graph extraction, and AI synthesis run in sequence.",
    },
    {
      step: "03",
      title: "Explore Segmented Insights",
      text: "Jump through architecture, graph, file tree, and starter guide tabs.",
    },
    {
      step: "04",
      title: "Share and Onboard Faster",
      text: "Send a clean share link and align your team on one mental model.",
    },
  ];

  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(160deg,#fffcf6_0%,#fff9ef_38%,#fffefb_100%)] text-[#1f1a15]">
      <div className="pointer-events-none absolute inset-0">
        <div className="float-slow absolute left-[-8rem] top-[-7rem] h-80 w-80 rounded-full bg-[#f6d7bc]/70 blur-3xl" />
        <div className="float-slow absolute right-[-8rem] top-[22rem] h-96 w-96 rounded-full bg-[#cce9df]/70 blur-3xl" />
        <div className="float-slow absolute bottom-[-9rem] left-[25%] h-80 w-80 rounded-full bg-[#dedffd]/60 blur-3xl" />
      </div>

      <header className="reveal relative mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 pb-8 pt-8 sm:px-10 lg:px-20">
        <a href="#" className="text-[1.06rem] font-semibold tracking-tight text-[#201912]">
          RepoMind <span className="text-[#8f7458]">Labs</span>
        </a>
        <nav className="hidden items-center gap-9 text-sm text-[#5f5346] md:flex">
          <a href="#features" className="transition hover:text-[#201b16]">
            Features
          </a>
          <a href="#segments" className="transition hover:text-[#201b16]">
            Segments
          </a>
          <a href="#workflow" className="transition hover:text-[#201b16]">
            Workflow
          </a>
          <a href="#pricing" className="transition hover:text-[#201b16]">
            Pricing
          </a>
        </nav>
        <a
          href="#pricing"
          className="rounded-full border border-[#ddcbb5] bg-white/95 px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow-md"
        >
          Start Free
        </a>
      </header>

      <main className="relative mx-auto w-full max-w-[1320px] px-6 pb-24 sm:px-10 lg:px-20 lg:pb-32">
        <section className="grid items-start gap-16 pb-24 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pt-16">
          <div className="reveal" style={{ animationDelay: "80ms" }}>
            <p className="mb-5 inline-flex rounded-full border border-[#e7d6c2] bg-white/90 px-3 py-1 text-xs font-medium tracking-[0.1em] text-[#6b5f52] uppercase">
              AI Codebase Intelligence
            </p>
            <h1 className="max-w-[17ch] text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[4.1rem]">
              Decode architecture faster than your standup starts.
            </h1>
            <p className="mt-6 max-w-[57ch] text-base leading-8 text-[#5b5044] sm:text-lg">
              RepoMind transforms a raw repository into segmented insights:
              architecture lens, dependency topology, onboarding route, and risk
              radar, all in one clean flow.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#pricing"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1f1a15] px-7 text-sm font-medium text-[#f8f2ea] transition hover:bg-[#17110a]"
              >
                Analyze My First Repo
              </a>
              <a
                href="#workflow"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#dac8b2] bg-white/90 px-7 text-sm font-medium text-[#2a231b] transition hover:bg-white"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-10 grid max-w-[38rem] gap-3 sm:grid-cols-3">
              {[
                ["< 60s", "first insight"],
                ["4 views", "segmented results"],
                ["24h", "cached analysis"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#e8dbc8] bg-white/80 px-4 py-3"
                >
                  <p className="text-lg font-semibold tracking-tight">{value}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#7c6f62]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="reveal rounded-3xl border border-[#e6d7c5] bg-white/92 p-5 shadow-[0_30px_90px_-42px_rgba(46,30,12,0.35)] sm:p-6"
            style={{ animationDelay: "170ms" }}
          >
            <div className="rounded-2xl border border-[#efe2d4] bg-[#fffdf9] p-5">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.08em] text-[#7b6f61]">
                <span>Live Analysis Canvas</span>
                <span className="text-[#8e6f4c]">Active</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#efe4d7]">
                <div className="pulse-bar h-full w-[76%] rounded-full bg-gradient-to-r from-[#a57d50] to-[#d7a16f]" />
              </div>
              <p className="mt-3 text-sm text-[#6a5f52]">
                Parsing project structure, extracting graph topology, and
                generating an onboarding route...
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#efe2d4] bg-[#fffdf9] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#837564]">
                  Files Parsed
                </p>
                <p className="mt-2 text-2xl font-semibold">1,274</p>
              </div>
              <div className="rounded-2xl border border-[#efe2d4] bg-[#fffdf9] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#837564]">
                  Entry Points
                </p>
                <p className="mt-2 text-2xl font-semibold">12</p>
              </div>
              <div className="rounded-2xl border border-[#efe2d4] bg-[#fffdf9] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#837564]">
                  Risk Flags
                </p>
                <p className="mt-2 text-2xl font-semibold">4</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#efe2d4] bg-[#fffdf9] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#837564]">
                Suggested Starting File
              </p>
              <p className="mt-2 text-sm font-medium text-[#3b3228]">
                <code>src/app/api/repos/analyze/route.ts</code>
              </p>
              <p className="mt-1 text-sm text-[#6b5f52]">
                Highest orchestration score: input validation, queue enqueue, and
                credit management in one route.
              </p>
            </div>
          </div>
        </section>

        <section id="segments" className="pb-24">
          <div className="reveal rounded-3xl border border-[#e3d2be] bg-white/85 p-6 shadow-[0_18px_60px_-46px_rgba(46,30,12,0.42)] sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#7f7266]">
                  Segments
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Built in modular insight segments
                </h2>
              </div>
              <p className="max-w-[34ch] text-sm leading-7 text-[#65594d]">
                Every analysis is grouped into focused segments so you can move
                from strategy to implementation without context switching.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {segments.map((segment, index) => (
                <article
                  key={segment.title}
                  className="stagger-in group rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-24px_rgba(30,18,8,0.4)]"
                  style={{ animationDelay: `${210 + index * 100}ms` }}
                >
                  <div
                    className={`mb-4 h-1.5 w-24 rounded-full bg-gradient-to-r ${segment.accent}`}
                  />
                  <h3 className="text-lg font-semibold tracking-tight">
                    {segment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#635749]">
                    {segment.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              title: "Architecture Map",
              body: "Visualize modules, boundaries, and data flow without opening 200 files.",
            },
            {
              title: "Dependency Graph",
              body: "Explore import relationships with an interactive graph to find hotspots fast.",
            },
            {
              title: "Starter Guide",
              body: "Get a beginner-friendly reading path and first tasks for contribution day one.",
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="stagger-in rounded-2xl border border-[#e8d8c6] bg-white/85 p-6 shadow-[0_12px_40px_-32px_rgba(39,24,10,0.35)]"
              style={{ animationDelay: `${320 + index * 90}ms` }}
            >
              <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#63574b]">{item.body}</p>
            </article>
          ))}
        </section>

        <section id="workflow" className="pb-24">
          <div className="rounded-3xl border border-[#e5d3bd] bg-white/85 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Workflow designed for momentum
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {timeline.map((item, idx) => (
                <div
                  key={item.title}
                  className="stagger-in rounded-2xl border border-[#ebddce] bg-[#fffdfa] p-5"
                  style={{ animationDelay: `${430 + idx * 90}ms` }}
                >
                  <p className="text-xs font-semibold tracking-[0.08em] text-[#8a7b6b] uppercase">
                    Step {item.step}
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-[#2a221a]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#5a4f43]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="pb-8">
          <div className="reveal rounded-3xl border border-[#e1cfb8] bg-[#1f1a15] px-6 py-10 text-[#f6ede2] sm:px-10 lg:px-14">
            <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#d9c4a7]">
              Ready to start
            </p>
            <h2 className="mt-3 max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Start free, then scale to pro when your workflow grows.
            </h2>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#f6eadc] px-7 text-sm font-medium text-[#1f1a15] transition hover:bg-[#fff4e9]"
              >
                Get Started Free
              </a>
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#6f5a43] px-7 text-sm font-medium text-[#f6ede2] transition hover:bg-[#30271f]"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1320px] px-6 pb-10 pt-6 text-xs text-[#7a6d5f] sm:px-10 lg:px-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>RepoMind</p>
          <p>Understand codebases faster, with structure and context.</p>
        </div>
      </footer>
    </div>
  );
}
