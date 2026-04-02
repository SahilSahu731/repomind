export default function UserActivityPage() {
  const events = [
    { text: "Generated architecture map for repomind/main", time: "2m ago", state: "Success" },
    { text: "Updated dependency graph snapshot for docs-redesign", time: "17m ago", state: "Updated" },
    { text: "Shared onboarding guide with 4 teammates", time: "48m ago", state: "Shared" },
    { text: "Queued new analysis for branch feature/auth-refactor", time: "1h ago", state: "Queued" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_100%)] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Activity</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">A quick timeline of what has changed in your workspace.</p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <ol className="space-y-3 text-sm text-[var(--muted)]">
          {events.map((event) => (
            <li key={event.text} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <span>{event.text}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-3)] px-2 py-1 text-xs text-[var(--secondary)]">
                  {event.state}
                </span>
                <span className="text-xs text-[var(--muted)]">{event.time}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
