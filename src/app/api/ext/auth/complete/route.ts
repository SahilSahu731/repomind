export async function GET() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RepoMind sign-in complete</title>
    <style>
      :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; background: #f5f0e5; color: #292721; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; }
      main { width: min(520px, calc(100% - 48px)); border: 1px solid #292721; padding: 40px; background: #f7f2e7; }
      p:first-child { font: 600 11px/1.4 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: #d75c3f; }
      h1 { font: 500 clamp(30px, 7vw, 48px)/1.05 Georgia, serif; margin: 16px 0; }
      p:last-child { color: #5e5952; line-height: 1.6; }
    </style>
  </head>
  <body><main><p>RepoMind connected</p><h1>Sign-in complete.</h1><p>This tab will close automatically. You can return to the RepoMind side panel.</p></main></body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    }
  );
}
