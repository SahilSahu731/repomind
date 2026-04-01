export default function UserDashboardPage() {
  const cards = [
    { label: "Analyzed Repositories", value: "12", hint: "+3 this week" },
    { label: "Saved Architecture Maps", value: "48", hint: "Across all projects" },
    { label: "Onboarding Playbooks", value: "9", hint: "Ready to share" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#ead9be] bg-[linear-gradient(155deg,#fff5e2_0%,#fefaf2_45%,#f5f9ff_100%)] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.11em] text-[#8f7759]">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2c2218]">
          Welcome to your insight cockpit
        </h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-7 text-[#5f5244]">
          Use this workspace to track your repository analysis momentum, review generated maps, and prioritize onboarding tasks.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#ecdcc5] bg-white px-5 py-4 shadow-[0_20px_30px_-30px_rgba(37,21,7,0.5)]">
            <p className="text-xs uppercase tracking-[0.08em] text-[#8d7d69]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#2a2117]">{card.value}</p>
            <p className="mt-1 text-sm text-[#625447]">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-2xl border border-[#ecdcc5] bg-white p-5">
          <h3 className="text-lg font-semibold tracking-tight text-[#2b2218]">Recent Focus Areas</h3>
          <ul className="mt-4 space-y-2 text-sm text-[#5f5245]">
            <li className="rounded-xl border border-[#f0e3d1] bg-[#fffdfa] px-3 py-2">Dependency cycles in `src/lib/services`</li>
            <li className="rounded-xl border border-[#f0e3d1] bg-[#fffdfa] px-3 py-2">Entry-point documentation for background workers</li>
            <li className="rounded-xl border border-[#f0e3d1] bg-[#fffdfa] px-3 py-2">Auth flow hardening and API boundary checks</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-[#ecdcc5] bg-[#2d2115] p-5 text-[#f4e8d8]">
          <p className="text-xs uppercase tracking-[0.09em] text-[#d6c2a6]">Pro Tip</p>
          <p className="mt-2 text-sm leading-7">
            Keep your analysis snapshots versioned by branch to compare architecture drift over time.
          </p>
        </article>
      </section>
    </div>
  );
}
