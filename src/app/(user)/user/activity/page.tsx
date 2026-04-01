export default function UserActivityPage() {
  const events = [
    "Generated architecture map for repomind/main",
    "Updated dependency graph snapshot for docs-redesign",
    "Shared onboarding guide with 4 teammates",
    "Queued new analysis for branch feature/auth-refactor",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#ebdcc7] bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#2b2219]">Activity</h2>
        <p className="mt-2 text-sm text-[#635648]">A quick timeline of what has changed in your workspace.</p>
      </section>

      <section className="rounded-2xl border border-[#eadbc6] bg-[#fffdfa] p-5">
        <ol className="space-y-3 text-sm text-[#5e5244]">
          {events.map((event) => (
            <li key={event} className="rounded-xl border border-[#efe2d1] bg-white px-3 py-2">
              {event}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
