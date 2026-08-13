import {
  Boxes,
  FileCode2,
  Layers,
  PanelsTopLeft,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import type { AnalysisResult } from "../../../shared/types";

interface Props {
  analysis: AnalysisResult;
}

const eyebrowStyle = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.67rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
};

const sectionTitleStyle = {
  fontFamily: "var(--font-serif, Georgia, serif)",
  fontSize: "1.05rem",
  fontWeight: 500,
  letterSpacing: "-0.02em",
};

export function ArchitectureView({ analysis }: Props) {
  const { architecture } = analysis;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <PanelsTopLeft size={17} aria-hidden="true" />
          <span style={eyebrowStyle}>System shape</span>
        </div>
        <h2 style={{ ...sectionTitleStyle, fontSize: "1.35rem" }}>
          {architecture.pattern || "Architecture pattern not identified"}
        </h2>
      </section>

      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Workflow size={17} aria-hidden="true" />
          <h3 style={sectionTitleStyle}>Data flow</h3>
        </div>
        <p style={{ fontSize: "0.86rem", lineHeight: 1.75 }}>
          {architecture.dataFlow || "No data-flow narrative was produced for this repository."}
        </p>
      </section>

      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Layers size={17} aria-hidden="true" />
          <h3 style={sectionTitleStyle}>Architectural layers</h3>
        </div>

        {architecture.layers.length > 0 ? (
          <ol style={{ display: "grid", gap: "var(--space-xs)", listStyle: "none" }}>
            {architecture.layers.map((layer, index) => (
              <li
                key={`${layer}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0, 1fr)",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  minHeight: 40,
                  padding: "var(--space-sm) var(--space-md)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span style={{ ...eyebrowStyle, color: "var(--accent-primary)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{layer}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ fontSize: "0.82rem" }}>No distinct architectural layers were detected.</p>
        )}
      </section>

      <section className="card" style={{ borderRadius: "var(--radius-sm)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Boxes size={17} aria-hidden="true" />
          <h3 style={sectionTitleStyle}>Modules and responsibilities</h3>
        </div>

        {architecture.modules.length > 0 ? (
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            {architecture.modules.map((module, index) => (
              <article
                key={`${module.path}-${module.name}-${index}`}
                style={{
                  padding: "var(--space-md)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-sm)",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  <h4 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 500 }}>
                    {module.name}
                  </h4>
                  <code style={{ maxWidth: "55%", overflowWrap: "anywhere", textAlign: "right" }}>
                    {module.path}
                  </code>
                </div>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.65 }}>{module.responsibility}</p>

                {module.keyFiles.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                      flexWrap: "wrap",
                      marginTop: "var(--space-sm)",
                    }}
                  >
                    <FileCode2 size={13} color="var(--text-tertiary)" aria-hidden="true" />
                    {module.keyFiles.slice(0, 5).map((file) => (
                      <span key={file} className="pill" style={{ fontSize: "0.68rem" }}>
                        {file}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.82rem" }}>No module boundaries were identified.</p>
        )}
      </section>

      {architecture.issues.length > 0 && (
        <section
          className="card"
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--warning)" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              marginBottom: "var(--space-md)",
            }}
          >
            <TriangleAlert size={17} color="var(--warning)" aria-hidden="true" />
            <h3 style={sectionTitleStyle}>Points to verify</h3>
          </div>
          <ul style={{ display: "grid", gap: "var(--space-sm)", listStyle: "none" }}>
            {architecture.issues.map((issue, index) => (
              <li
                key={`${issue}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "18px minmax(0, 1fr)",
                  gap: "var(--space-sm)",
                  alignItems: "start",
                  padding: "var(--space-sm) 0",
                  borderTop: index === 0 ? "none" : "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ ...eyebrowStyle, color: "var(--warning)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
