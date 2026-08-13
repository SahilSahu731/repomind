import type { NextRequest } from "next/server";
import { corsOk, rejectDisallowedCorsOrigin, withCors } from "@/lib/cors";
import { getExtensionPrincipal } from "@/lib/extensionAuth";
import { getAnalysisResultByRepoId, listReposByUser } from "@/lib/supabaseDb";
import { generateWithGemini, hasGeminiKey } from "@/lib/ai";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const originRejection = rejectDisallowedCorsOrigin(origin);
  if (originRejection) return originRejection;

  try {
    const principal = await getExtensionPrincipal(req);
    if (!principal) {
      return withCors(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        origin,
        401
      );
    }

    if (!hasGeminiKey()) {
      return withCors(
        { success: false, error: { code: "AI_UNAVAILABLE", message: "AI service not configured" } },
        origin,
        503
      );
    }

    const body = await req.json();
    const { repoA, repoB } = body as {
      repoA: { owner: string; repo: string };
      repoB: { owner: string; repo: string };
    };

    if (!repoA?.owner || !repoA?.repo || !repoB?.owner || !repoB?.repo) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Missing repo info for comparison" } },
        origin,
        400
      );
    }

    // Find the newest completed analyses regardless of which default branch
    // each repository uses.
    const urlA = `https://github.com/${repoA.owner}/${repoA.repo}`;
    const urlB = `https://github.com/${repoB.owner}/${repoB.repo}`;
    const { repos } = await listReposByUser(principal.id, 1, 100, "COMPLETE");
    const rowA = repos.find((row) => row.githubUrl === urlA && row.status === "COMPLETE");
    const rowB = repos.find((row) => row.githubUrl === urlB && row.status === "COMPLETE");

    if (!rowA || !rowB) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "Both repos must be analyzed first" } },
        origin,
        404
      );
    }

    const [analysisA, analysisB] = await Promise.all([
      getAnalysisResultByRepoId(rowA.id),
      getAnalysisResultByRepoId(rowB.id),
    ]);

    if (!analysisA || !analysisB) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "Analysis results missing for one or both repos" } },
        origin,
        404
      );
    }

    // Use AI to generate comparison
    const prompt = `Compare these two GitHub repositories:

## Repository A: ${repoA.owner}/${repoA.repo}
Summary: ${analysisA.summary}
Tech Stack: ${JSON.stringify(analysisA.techStack)}
Architecture: ${JSON.stringify((analysisA.architecture as Record<string, unknown>)?.pattern ?? "unknown")}

## Repository B: ${repoB.owner}/${repoB.repo}
Summary: ${analysisB.summary}
Tech Stack: ${JSON.stringify(analysisB.techStack)}
Architecture: ${JSON.stringify((analysisB.architecture as Record<string, unknown>)?.pattern ?? "unknown")}

Provide a structured comparison as JSON with this format:
{
  "summary": "Brief comparison overview",
  "similarities": ["list of similarities"],
  "differences": ["list of differences"],
  "recommendation": "Which to use and when",
  "scores": {
    "repoA": { "codeQuality": 0-10, "documentation": 0-10, "maintainability": 0-10 },
    "repoB": { "codeQuality": 0-10, "documentation": 0-10, "maintainability": 0-10 }
  }
}`;

    const response = await generateWithGemini({ prompt, responseMimeType: "application/json" });
    const comparison = JSON.parse(response);

    return withCors(
      {
        success: true,
        data: {
          repoA: { owner: repoA.owner, repo: repoA.repo },
          repoB: { owner: repoB.owner, repo: repoB.repo },
          comparison,
        },
      },
      origin
    );
  } catch (error: unknown) {
    console.error("[ext/compare] Error:", error);
    return withCors(
      { success: false, error: { code: "COMPARE_FAILED", message: "Failed to compare repositories" } },
      origin,
      500
    );
  }
}
