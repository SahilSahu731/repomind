export function LandingSegments() {
  const segments = [
    {
      title: "Architecture Lens",
      detail:
        "Visual module map with ownership hints and coupling risks surfaced early.",
      accent: "from-[#67e8f9] to-[#22d3ee]",
    },
    {
      title: "Dependency Topology",
      detail:
        "Interactive relationship graph to expose hotspots and import gravity.",
      accent: "from-[#f6c177] to-[#f2a65a]",
    },
    {
      title: "Onboarding Route",
      detail:
        "A practical first-day reading path with exact files and why they matter.",
      accent: "from-[#a5b4fc] to-[#7c3aed]",
    },
    {
      title: "Risk Radar",
      detail:
        "Flags fragile zones and architecture debt patterns before you touch production code.",
      accent: "from-[#fda4af] to-[#fb7185]",
    },
  ];

  return (
    <section className="pb-24">
      <div className="reveal rounded-3xl border border-border bg-[var(--surface)] p-6 shadow-[0_18px_60px_-46px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">What you get</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Four clear lenses on every repository
            </h2>
          </div>
          <p className="max-w-[34ch] text-sm leading-7 text-muted">
            Every analysis is grouped into focused segments so the team can move from strategy to implementation without context switching.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {segments.map((segment, index) => (
            <article
              key={segment.title}
              className="stagger-in rounded-2xl border border-border bg-[var(--surface-2)] p-5 transition hover:-translate-y-0.5 hover:bg-[var(--surface-3)]"
              style={{ animationDelay: `${220 + index * 90}ms` }}
            >
              <div className={`mb-4 h-1.5 w-24 rounded-full bg-gradient-to-r ${segment.accent}`} />
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{segment.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{segment.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  const features = [
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
  ];

  return (
    <section id="features" className="pb-24">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((item, index) => (
          <article
            key={item.title}
            className="stagger-in rounded-2xl border border-border bg-[var(--surface)] p-6"
            style={{ animationDelay: `${330 + index * 90}ms` }}
          >
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LandingWorkflow() {
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
    <section id="workflow" className="pb-24">
      <div className="rounded-3xl border border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Workflow designed for momentum
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {timeline.map((item, idx) => (
            <div
              key={item.title}
              className="stagger-in rounded-2xl border border-border bg-[var(--surface)] p-5"
              style={{ animationDelay: `${440 + idx * 90}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                Step {item.step}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section id="pricing" className="pb-8">
      <div className="reveal rounded-3xl border border-border bg-[linear-gradient(155deg,var(--surface)_0%,#0f1720_100%)] px-6 py-10 text-foreground sm:px-10 lg:px-14">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
          Ready to start
        </p>
        <h2 className="mt-3 max-w-[22ch] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Start free, then scale to pro when your workflow grows.
        </h2>
        <p className="mt-4 max-w-[52ch] text-sm leading-7 text-muted">
          Analyze your first repository, generate a route into the workspace, and keep the entire team aligned with one clear preview.
        </p>
      </div>
    </section>
  );
}
