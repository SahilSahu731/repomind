export default function UserSettingsPage() {
  const settings = [
    { label: "Email notifications", value: "Enabled" },
    { label: "Weekly summary", value: "Every Monday" },
    { label: "Default analysis depth", value: "Balanced" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_100%)] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h2>
        <p className="mt-2 text-sm text-muted">Fine tune your workspace preferences and analysis defaults.</p>
      </section>

      <section className="space-y-3">
        {settings.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted">Workspace-level preference</p>
            </div>
            <span className="rounded-full border border-border bg-surface-3 px-3 py-1 text-xs font-medium text-secondary">
              {item.value}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">Automation Guardrails</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">Rate-limit alerts enabled</div>
          <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">Retry failed jobs once</div>
          <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">Auto-archive stale snapshots</div>
        </div>
      </section>
    </div>
  );
}
