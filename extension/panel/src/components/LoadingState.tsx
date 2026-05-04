import type { AnalysisProgress, RepoInfo } from "../../../shared/types";
import { ANALYSIS_STEPS } from "../../../shared/types";

interface Props {
  progress: AnalysisProgress;
  repo: RepoInfo;
}

export function LoadingState({ progress, repo }: Props) {
  const stepInfo = ANALYSIS_STEPS[progress.currentStep] ?? {
    label: progress.currentStep,
    icon: "⏳",
  };
  const pct = Math.max(0, Math.min(100, progress.progress));

  return (
    <div
      style={{
        padding: "var(--space-2xl) var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-xl)",
      }}
    >
      {/* Repo info */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.1rem" }}>
          {repo.owner}/{repo.repo}
        </h2>
        {repo.description && (
          <p style={{ fontSize: "0.85rem", marginTop: "var(--space-xs)", maxWidth: "280px" }}>
            {repo.description}
          </p>
        )}
      </div>

      {/* Animated scanner */}
      <div
        className="animate-pulse-glow"
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "var(--accent-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
        }}
      >
        {stepInfo.icon}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 280 }}>
        <div
          style={{
            height: 6,
            borderRadius: "var(--radius-full)",
            background: "var(--bg-tertiary)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-gradient)",
              transition: "width 0.5s var(--ease-out)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--space-sm)",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>{stepInfo.label}</span>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{pct}%</span>
        </div>
      </div>

      {/* Step timeline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          width: "100%",
          maxWidth: 280,
        }}
      >
        {Object.entries(ANALYSIS_STEPS)
          .filter(([key]) => key !== "failed")
          .map(([key, step]) => {
            const stepIdx = Object.keys(ANALYSIS_STEPS).indexOf(key);
            const currentIdx = Object.keys(ANALYSIS_STEPS).indexOf(progress.currentStep);
            const isDone = stepIdx < currentIdx;
            const isCurrent = key === progress.currentStep;

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  opacity: isDone || isCurrent ? 1 : 0.3,
                  transition: "opacity 0.3s",
                }}
              >
                <span style={{ fontSize: "0.9rem", width: 20, textAlign: "center" }}>
                  {isDone ? "✅" : isCurrent ? step.icon : "○"}
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: isCurrent ? "var(--accent-primary)" : isDone ? "var(--success)" : "var(--text-tertiary)",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
