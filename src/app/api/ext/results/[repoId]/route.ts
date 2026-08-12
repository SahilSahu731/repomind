import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { corsOk, withCors } from "@/lib/cors";
import { getAnalysisResultByRepoId, getRepoById } from "@/lib/supabaseDb";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const origin = req.headers.get("origin");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return withCors(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        origin,
        401
      );
    }

    const { repoId } = await params;

    if (!repoId) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Missing repoId" } },
        origin,
        400
      );
    }

    const repo = await getRepoById(repoId);
    if (!repo || repo.userId !== session.user.id) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "Analysis results not found" } },
        origin,
        404
      );
    }

    const result = await getAnalysisResultByRepoId(repoId);

    if (!result) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "Analysis results not found" } },
        origin,
        404
      );
    }

    // Shape the response to match what the extension expects
    return withCors(
      {
        success: true,
        data: {
          repoId: result.repoId,
          summary: result.summary,
          architecture: result.architecture,
          techStack: result.techStack,
          dependencyGraph: result.dependencyGraph,
          entryPoints: result.entryPoints,
          startGuide: result.startGuide,
          fileSummaries: result.fileSummaries,
          fileTree: result.fileTree,
        },
      },
      origin
    );
  } catch (error: unknown) {
    console.error("[ext/results] Error:", error);
    return withCors(
      { success: false, error: { code: "INTERNAL", message: "Failed to get results" } },
      origin,
      500
    );
  }
}
