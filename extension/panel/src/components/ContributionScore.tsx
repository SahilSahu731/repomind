import { BookOpen, CircleCheck, CircleX, Gauge } from "lucide-react";
import type { ContributionScoreBreakdown } from "../../../shared/types";

interface Props {
  score: ContributionScoreBreakdown;
}

export function ContributionScore({ score }: Props) {
  const value = Math.min(100, Math.max(0, score.total));
  const color =
    value >= 70 ? "var(--success)" : value >= 40 ? "var(--warning)" : "var(--danger)";
  const label =
    value >= 70
      ? "Well prepared for contributors"
      : value >= 40
        ? "Some onboarding friction"
        : "Significant setup friction";

  const factors = [
    { label: "Contribution guide", met: score.hasContributing },
    { label: "Setup instructions", met: score.hasSetupInstructions },
    { label: "Continuous integration", met: score.hasCiCd },
    { label: "Good-first-issue signals", met: score.hasGoodFirstIssues },
    { label: "Code of conduct", met: score.hasCodeOfConduct },
    { label: "Repository license", met: score.hasLicense },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "88px minmax(0, 1fr)",
          alignItems: "center",
          gap: "var(--space-lg)",
          paddingBottom: "var(--space-lg)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            minHeight: 78,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "var(--space-sm)",
            border: `1px solid ${color}`,
            borderRadius: "var(--radius-sm)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              color,
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "2rem",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          <span
            style={{
              marginTop: 4,
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            out of 100
          </span>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <Gauge size={15} color={color} aria-hidden="true" />
            <span style={{ color, fontSize: "0.82rem", fontWeight: 600 }}>{label}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Contribution readiness score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            style={{
              height: 6,
              marginTop: "var(--space-sm)",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${value}%`,
                height: "100%",
                background: color,
                transition: "width 0.45s var(--ease-out)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              marginTop: "var(--space-sm)",
              color: "var(--text-tertiary)",
              fontSize: "0.7rem",
            }}
          >
            <BookOpen size={13} aria-hidden="true" />
            README quality: {Math.max(0, Math.min(25, score.readmeQuality))}/25
          </div>
        </div>
      </div>

      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-xs) var(--space-md)",
          marginTop: "var(--space-md)",
          listStyle: "none",
        }}
      >
        {factors.map((factor) => (
          <li
            key={factor.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              minHeight: 28,
              color: factor.met ? "var(--text-primary)" : "var(--text-tertiary)",
              fontSize: "0.74rem",
            }}
          >
            {factor.met ? (
              <CircleCheck size={14} color="var(--success)" aria-hidden="true" />
            ) : (
              <CircleX size={14} color="var(--text-tertiary)" aria-hidden="true" />
            )}
            <span>{factor.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
