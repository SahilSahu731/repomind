import { ImageResponse } from "next/og";

export const alt = "RepoMind — Understand any GitHub codebase faster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function SocialBrandMark() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 40 40">
      <path d="M8 8h10v10H8z" fill="#d75c3f" />
      <path d="M22 8h10v10H22z" fill="#d75c3f" opacity=".42" />
      <path d="M8 22h10v10H8z" fill="#d75c3f" opacity=".42" />
      <path d="M22 22h10v10H22z" fill="#d75c3f" />
      <path
        d="M18 13h4M13 18v4M27 18v4M18 27h4"
        fill="none"
        stroke="#d75c3f"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#f5f0e5",
        color: "#292721",
        display: "flex",
        height: "100%",
        padding: 36,
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid #292721",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <svg
          aria-hidden="true"
          width="510"
          height="430"
          viewBox="0 0 510 430"
          style={{ position: "absolute", right: -20, top: 92, opacity: 0.22 }}
        >
          <g fill="none" stroke="#6f8765" strokeWidth="2">
            <path d="M24 90 168 36l126 82 156-50M168 36l10 164 116-82 34 180M178 200 60 330m118-130 150 98m0 0 142 68M60 330l170 58 98-90" />
          </g>
          <g fill="#f5f0e5" stroke="#292721" strokeWidth="2">
            <circle cx="24" cy="90" r="10" /><circle cx="168" cy="36" r="13" />
            <circle cx="294" cy="118" r="11" /><circle cx="450" cy="68" r="9" />
            <circle cx="178" cy="200" r="15" /><circle cx="60" cy="330" r="10" />
            <circle cx="328" cy="298" r="16" /><circle cx="470" cy="366" r="10" />
            <circle cx="230" cy="388" r="8" />
          </g>
          <circle cx="328" cy="298" r="7" fill="#d75c3f" />
        </svg>

        <div
          style={{
            alignItems: "center",
            borderBottom: "1px solid #292721",
            display: "flex",
            height: 92,
            justifyContent: "space-between",
            padding: "0 38px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", fontSize: 25, fontWeight: 700 }}>
            <SocialBrandMark />
            <span style={{ marginLeft: 11 }}>RepoMind</span>
          </div>
          <div
            style={{
              border: "1px solid #292721",
              borderRadius: 999,
              display: "flex",
              fontSize: 14,
              letterSpacing: 2,
              padding: "10px 16px",
            }}
          >
            REPOSITORY INTELLIGENCE
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "48px 40px 34px" }}>
          <div style={{ color: "#d75c3f", display: "flex", fontSize: 15, letterSpacing: 3 }}>
            READ THE SYSTEM, NOT JUST THE FILES
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 72,
              letterSpacing: -4,
              lineHeight: 0.95,
              marginTop: 25,
              maxWidth: 800,
            }}
          >
            Understand the code before you change it.
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 15,
              marginTop: "auto",
            }}
          >
            {[
              "Architecture",
              "Dependencies",
              "Entry points",
              "Onboarding",
            ].map((label, index) => (
              <div key={label} style={{ alignItems: "center", display: "flex" }}>
                {index > 0 ? <span style={{ color: "#a59d90", margin: "0 16px" }}>—</span> : null}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
