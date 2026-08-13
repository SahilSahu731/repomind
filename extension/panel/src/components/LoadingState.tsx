import { Check, Circle, LoaderCircle } from "lucide-react";
import type { AnalysisProgress, RepoInfo } from "../../../shared/types";
import { ANALYSIS_STEPS } from "../../../shared/types";

interface Props {
  progress: AnalysisProgress;
  repo: RepoInfo;
}

const visibleSteps = Object.entries(ANALYSIS_STEPS).filter(
  ([key]) => !["failed", "complete"].includes(key)
);

export function LoadingState({ progress, repo }: Props) {
  const currentIndex = visibleSteps.findIndex(([key]) => key === progress.currentStep);
  const percent = Math.max(0, Math.min(100, progress.progress));

  return (
    <main className="loading-page">
      <div className="loading-heading">
        <p className="eyebrow">Repository analysis in progress</p>
        <h1>Building the map.</h1>
        <p>{repo.owner}/{repo.repo}</p>
      </div>

      <div className="progress-meter" aria-label={`${percent}% complete`}>
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-caption">
        <span>{ANALYSIS_STEPS[progress.currentStep]?.label ?? progress.currentStep}</span>
        <strong>{percent}%</strong>
      </div>

      <ol className="analysis-route">
        {visibleSteps.map(([key, step], index) => {
          const complete = currentIndex > index;
          const current = key === progress.currentStep;
          return (
            <li key={key} className={complete ? "complete" : current ? "current" : ""}>
              <span className="route-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="route-icon">
                {complete ? <Check size={13} /> : current ? <LoaderCircle className="spin" size={13} /> : <Circle size={10} />}
              </span>
              <span>{step.label.replace("...", "")}</span>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
