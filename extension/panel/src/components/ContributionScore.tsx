import type { ContributionScoreBreakdown } from "../../../shared/types";

interface Props {
  score: ContributionScoreBreakdown;
}

export function ContributionScore({ score }: Props) {
  const pct = Math.min(100, Math.max(0, score.total));
  const color =
    pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)";
  const label = pct >= 70 ? "Ready to contribute" : pct >= 40 ? "Some friction" : "Hard to contribute";

  const factors = [
    { label: "CONTRIBUTING.md", met: score.hasContributing },
    { label: "Setup instructions", met: score.hasSetupInstructions },
    { label: "CI/CD configured", met: score.hasCiCd },
    { label: "Good first issues", met: score.hasGoodFirstIssues },
    { label: "Code of conduct", met: score.hasCodeOfConduct },
    { label: "License", met: score.hasLicense },
  ];

  return (
    <div>
      {/* Score gauge */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <svg viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="6"
            />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={`${(pct / 100) * 188.5} 188.5`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s var(--ease-out)" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.1rem",
              color,
            }}
          >
            {pct}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color }}>{label}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2 }}>
            out of 100
          </div>
        </div>
      </div>

      {/* Factor checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        {factors.map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              fontSize: "0.8rem",
              color: f.met ? "var(--success)" : "var(--text-tertiary)",
            }}
          >
            <span>{f.met ? "✅" : "○"}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
