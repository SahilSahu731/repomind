export default function UserSettingsPage() {
  const settings = [
    { label: "Email notifications", value: "Enabled" },
    { label: "Weekly summary", value: "Every Monday" },
    { label: "Default analysis depth", value: "Balanced" },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#ead9c0] bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#2a2118]">Settings</h2>
        <p className="mt-2 text-sm text-[#635648]">Fine tune your workspace preferences and analysis defaults.</p>
      </section>

      <section className="space-y-3">
        {settings.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#ebddca] bg-[#fffdfa] px-5 py-4">
            <p className="text-sm font-medium text-[#31261c]">{item.label}</p>
            <span className="rounded-full border border-[#e1ceb3] bg-[#fff4e4] px-3 py-1 text-xs font-medium text-[#6f5a40]">{item.value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
