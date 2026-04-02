export default function UserDashboardPage() {
  const cards = [
    { label: "Analyzed Repositories", value: "12", hint: "+3 this week", progress: "74%" },
    { label: "Saved Architecture Maps", value: "48", hint: "Across all projects", progress: "61%" },
    { label: "Onboarding Playbooks", value: "9", hint: "Ready to share", progress: "88%" },
  ];

  const pipeline = [
    { stage: "Queued", count: 4, tone: "bg-surface-3 text-secondary" },
    { stage: "Running", count: 2, tone: "bg-surface-3 text-primary" },
    { stage: "Ready", count: 7, tone: "bg-surface-3 text-emerald-300" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_100%)] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.11em] text-secondary">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome to your insight cockpit
        </h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-7 text-muted">
          Use this workspace to track your repository analysis momentum, review generated maps, and prioritize onboarding tasks.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {pipeline.map((item) => (
            <span
              key={item.stage}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}
            >
              {item.stage}: {item.count}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{card.value}</p>
            <p className="mt-1 text-sm text-muted">{card.hint}</p>
            <div className="mt-4 h-2 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary" style={{ width: card.progress }} />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Recent Focus Areas</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="rounded-xl border border-border bg-surface-2 px-3 py-2">Dependency cycles in `src/lib/services`</li>
            <li className="rounded-xl border border-border bg-surface-2 px-3 py-2">Entry-point documentation for background workers</li>
            <li className="rounded-xl border border-border bg-surface-2 px-3 py-2">Auth flow hardening and API boundary checks</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-border bg-surface-2 p-5 text-foreground">
          <p className="text-xs uppercase tracking-[0.09em] text-secondary">Pro Tip</p>
          <p className="mt-2 text-sm leading-7">
            Keep your analysis snapshots versioned by branch to compare architecture drift over time.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-surface-3 p-3 text-xs text-muted">
            Latest branch baseline: <span className="font-semibold text-foreground">main@8f93a1</span>
          </div>
        </article>
      </section>
    </div>
  );
}
