import type { AnalysisResult } from "../../../shared/types";

interface Props {
  analysis: AnalysisResult;
}

export function ArchitectureView({ analysis }: Props) {
  const { architecture } = analysis;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* Pattern */}
      <div className="card animate-slide-up">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
          <span style={{ fontSize: "1.3rem" }}>🏗️</span>
          <h3 style={{ fontSize: "0.95rem" }}>Architecture Pattern</h3>
        </div>
        <span
          className="pill pill--accent"
          style={{ fontSize: "0.9rem", padding: "6px 14px" }}
        >
          {architecture.pattern}
        </span>
      </div>

      {/* Data Flow */}
      <div className="card animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-sm)" }}>🔄 Data Flow</h3>
        <p style={{ fontSize: "0.85rem" }}>{architecture.dataFlow}</p>
      </div>

      {/* Layers */}
      <div className="card animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>📚 Layers</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {architecture.layers.map((layer, i) => (
            <div
              key={layer}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: `rgba(99, 102, 241, ${0.05 + i * 0.03})`,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.85rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
              }}
            >
              <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>L{i + 1}</span>
              {layer}
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="card animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>📦 Modules</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {architecture.modules.map((mod) => (
            <div
              key={mod.name}
              style={{
                padding: "var(--space-md)",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{mod.name}</span>
                <code style={{ fontSize: "0.7rem" }}>{mod.path}</code>
              </div>
              <p style={{ fontSize: "0.8rem", marginBottom: "var(--space-sm)" }}>
                {mod.responsibility}
              </p>
              <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                {mod.keyFiles.slice(0, 4).map((f) => (
                  <span key={f} className="pill" style={{ fontSize: "0.7rem" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {architecture.issues.length > 0 && (
        <div className="card animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>⚠️ Potential Issues</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {architecture.issues.map((issue, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "var(--space-sm)",
                  fontSize: "0.8rem",
                  color: "var(--warning)",
                  padding: "var(--space-sm)",
                  background: "rgba(210, 153, 34, 0.08)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span>⚠️</span>
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
