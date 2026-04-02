export function LandingProof() {
  const proof = [
    {
      title: "Architecture lens",
      body: "Understand the shape of the project before opening the source tree.",
    },
    {
      title: "Dependency map",
      body: "See how files connect and where the risky coupling lives.",
    },
    {
      title: "Onboarding path",
      body: "Get a practical starting route for the first files and first tasks.",
    },
    {
      title: "Risk radar",
      body: "Spot fragile areas early so refactors do not feel blind.",
    },
  ];

  return (
    <section className="pb-24">
      <div className="reveal rounded-3xl border border-border bg-surface p-6 shadow-[0_18px_60px_-46px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">What you get</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            A landing page that explains the product clearly.
          </h2>
          <p className="text-sm leading-7 text-muted">
            Everything below is stacked and calm, so the repository search stays the main action.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {proof.map((item, index) => (
            <article
              key={item.title}
              className="stagger-in rounded-2xl border border-border bg-surface-2 p-5"
              style={{ animationDelay: `${220 + index * 90}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                Section {index + 1}
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
      title: "Paste the repo link",
      body: "Drop any public GitHub repository into the search bar.",
    },
    {
      step: "02",
      title: "Run the analysis",
      body: "The app validates the URL, starts the analysis, and prepares the workspace route.",
    },
    {
      step: "03",
      title: "Open the workspace",
      body: "Jump straight into the dashboard with the generated repository context.",
    },
    {
      step: "04",
      title: "Share the result",
      body: "Use the output to align product, platform, and onboarding discussions.",
    },
  ];

  return (
    <section id="flow" className="pb-24">
      <div className="rounded-3xl border border-border bg-linear-to-b from-surface to-surface-2 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">How it works</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Four calm steps from repo link to workspace.
          </h2>
        </div>

        <div className="mt-8 space-y-4">
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
    <section className="pb-8">
      <div className="reveal rounded-3xl border border-border bg-linear-to-br from-primary/20 via-surface-2 to-surface px-6 py-10 text-foreground sm:px-10 lg:px-14">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
            Ready when you are
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Paste a repository and get a better first look.
          </h2>
          <p className="text-sm leading-7 text-muted">
            The landing page is now rebuilt as a vertical experience with the search bar at the top and the rest of the story below it.
          </p>
        </div>
      </div>
    </section>
  );
}
