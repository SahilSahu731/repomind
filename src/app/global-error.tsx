"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f5f0e5", color: "#292721", fontFamily: "Georgia, serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
          <div style={{ width: "100%", maxWidth: "720px", borderTop: "1px solid #292721", borderBottom: "1px solid #292721", padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: ".18em", textTransform: "uppercase", color: "#a33f2b" }}>RepoMind · System interruption</p>
            <h1 style={{ margin: "24px auto 0", maxWidth: "620px", fontSize: "clamp(42px, 8vw, 72px)", fontWeight: 400, lineHeight: .95, letterSpacing: "-.045em" }}>We lost the map for a moment.</h1>
            <p style={{ margin: "24px auto 0", maxWidth: "520px", fontFamily: "Arial, sans-serif", fontSize: "15px", lineHeight: 1.7, color: "#5e5952" }}>The error has been recorded when monitoring is configured. You can safely retry without changing any repository.</p>
            {error.digest ? <p style={{ marginTop: "16px", fontFamily: "monospace", fontSize: "9px", color: "#8a8378" }}>Reference · {error.digest}</p> : null}
            <button type="button" onClick={() => unstable_retry()} style={{ marginTop: "32px", minHeight: "48px", border: 0, borderRadius: "999px", background: "#292721", color: "#f5f0e5", padding: "0 24px", fontSize: "14px", cursor: "pointer" }}>Try RepoMind again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
