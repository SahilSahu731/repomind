import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  // This is the callback URL after successful NextAuth sign-in.
  // The user will already have a session cookie set by NextAuth.
  // We create a simple token (the session user's ID) and redirect
  // to a page that the extension's background worker can detect.

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Auth failed — redirect to login
    return Response.redirect(`${env.NEXTAUTH_URL}/login`);
  }

  // Generate a simple token for the extension (the session cookie itself
  // handles real auth, but the extension needs something to store).
  // In production, you'd want a proper JWT here.
  const token = Buffer.from(
    JSON.stringify({
      userId: session.user.id,
      ts: Date.now(),
    })
  ).toString("base64url");

  // Redirect to a URL the extension's background worker detects
  const redirectUrl = new URL(`${env.NEXTAUTH_URL}/api/ext/auth/callback`);
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("success", "true");

  // Return an HTML page that shows success and auto-closes
  return new Response(
    `<!DOCTYPE html>
<html>
<head><title>RepoMind — Signed In</title></head>
<body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0d1117;color:#e6edf3;">
  <div style="text-align:center;">
    <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
    <h1 style="font-size:1.5rem;margin-bottom:0.5rem;">Signed in to RepoMind</h1>
    <p style="color:#8b949e;">You can close this tab. The extension is now connected.</p>
    <script>
      // The extension's background worker listens for this URL pattern
      // and extracts the token from the URL params.
      // Auto-close after a short delay
      setTimeout(() => window.close(), 2000);
    </script>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
