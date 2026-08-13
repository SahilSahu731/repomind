import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  guide: string;
}

export function OnboardingGuide({ guide }: Props) {
  return (
    <section
      style={{
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <BookOpen size={18} aria-hidden="true" />
        <div>
          <p
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.64rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            First working session
          </p>
          <h2
            style={{
              marginTop: 2,
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "1.08rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            Onboarding guide
          </h2>
        </div>
      </header>

      <div className="markdown-body" style={{ padding: "var(--space-lg)" }}>
        {guide.trim() ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => {
                void node;
                return <a {...props} target="_blank" rel="noopener noreferrer" />;
              },
            }}
          >
            {guide}
          </ReactMarkdown>
        ) : (
          <p>No onboarding guidance was generated for this repository.</p>
        )}
      </div>
    </section>
  );
}
