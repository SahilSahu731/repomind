export function LandingProof() {
  const proof = [
    {
      title: "Architecture Lens",
      body: "Identify core modules and boundaries before touching source files.",
    },
    {
      title: "Dependency Graph",
      body: "Trace coupling and blast radius to de-risk high-impact changes.",
    },
    {
      title: "Onboarding Route",
      body: "Generate clear first steps for new engineers entering complex repos.",
    },
    {
      title: "Risk Radar",
      body: "Surface fragile integration points before releases and migrations.",
    },
  ];

  return (
    <section id="segments" className="pb-22 pt-14">
      <div className="reveal rounded-3xl border border-border bg-[linear-gradient(165deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-6 shadow-[0_24px_72px_-48px_rgba(0,0,0,0.75)] sm:p-8 lg:p-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">Core Capabilities</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Built to make large codebases legible.
          </h2>
          <p className="text-sm leading-7 text-muted">
            Get the same strategic context you would expect from a senior platform review, but generated from a single repository link.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {proof.map((item, index) => (
            <article
              key={item.title}
              className="stagger-in rounded-2xl border border-border bg-surface-2 p-5"
              style={{ animationDelay: `${160 + index * 90}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                Capability {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFlow() {
  const steps = [
    {
      step: "01",
      title: "Paste Any Public Repo",
      body: "Drop a GitHub URL into the analyze bar to initialize context.",
    },
    {
      step: "02",
      title: "Run Deep Analysis",
      body: "RepoMind validates input, scans structure, and builds dependency relationships.",
    },
    {
      step: "03",
      title: "Open The Workspace",
      body: "Move directly into a dashboard seeded with project-aware findings.",
    },
    {
      step: "04",
      title: "Share Team Context",
      body: "Use shared insights to align architecture decisions and delivery priorities.",
    },
  ];

  return (
    <section id="workflow" className="pb-24 pt-2">
      <div className="rounded-3xl border border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">Workflow</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Four steps from URL to technical clarity.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {steps.map((item, index) => (
            <article
              key={item.title}
              className="stagger-in rounded-2xl border border-border bg-surface p-5"
              style={{ animationDelay: `${340 + index * 90}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                Step {item.step}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section id="pricing" className="pb-10">
      <div className="reveal rounded-3xl border border-border bg-[linear-gradient(140deg,rgba(34,211,238,0.16)_0%,rgba(15,23,42,0.7)_36%,rgba(234,88,12,0.14)_100%)] px-6 py-10 text-foreground sm:px-10 lg:px-14">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
            Launch Your Analysis
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Give every team a shared map of the codebase.
          </h2>
          <p className="text-sm leading-7 text-muted">
            Start with one repository URL and move faster on onboarding, architecture reviews, and release planning.
          </p>
        </div>
      </div>
    </section>
  );
}
