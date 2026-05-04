import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { corsOk, withCors } from "@/lib/cors";
import { getAnalysisResultByRepoId } from "@/lib/supabaseDb";
import { generateWithGemini, hasGeminiKey } from "@/lib/ai";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
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

    if (!hasGeminiKey()) {
      return withCors(
        { success: false, error: { code: "AI_UNAVAILABLE", message: "AI service not configured" } },
        origin,
        503
      );
    }

    const body = await req.json();
    const { repoId, message, history } = body as {
      repoId: string;
      message: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!repoId || !message) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Missing repoId or message" } },
        origin,
        400
      );
    }

    // Fetch the analysis to use as context
    const analysis = await getAnalysisResultByRepoId(repoId);
    if (!analysis) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "No analysis found for this repo" } },
        origin,
        404
      );
    }

    // Build context from analysis data
    const repoContext = buildRepoContext(analysis);

    // Build conversation for the AI
    const conversationHistory = (history ?? [])
      .slice(-10) // Last 10 messages for context window
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are RepoMind AI, an expert code assistant that helps developers understand codebases.
You have deep knowledge of the following repository:

${repoContext}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}User's question: ${message}

Instructions:
- Answer based on the actual repository structure, code, and analysis above.
- Be specific — reference actual file paths, function names, and architectural patterns.
- If you're unsure about something, say so rather than guessing.
- Keep answers concise but thorough.
- Use markdown formatting for code blocks and lists.`;

    const response = await generateWithGemini({
      prompt,
      responseMimeType: "text/plain",
    });

    return withCors(
      { success: true, data: { response } },
      origin
    );
  } catch (error: unknown) {
    console.error("[ext/chat] Error:", error);
    return withCors(
      { success: false, error: { code: "CHAT_FAILED", message: "Failed to generate response" } },
      origin,
      500
    );
  }
}

function buildRepoContext(analysis: {
  summary: string;
  architecture: unknown;
  techStack: unknown;
  entryPoints: unknown;
  fileSummaries: unknown;
}): string {
  const sections: string[] = [];

  sections.push(`## Summary\n${analysis.summary}`);

  if (analysis.techStack && typeof analysis.techStack === "object") {
    const ts = analysis.techStack as Record<string, string[]>;
    const items = Object.entries(ts)
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([k, v]) => `- ${k}: ${v.join(", ")}`)
      .join("\n");
    if (items) sections.push(`## Tech Stack\n${items}`);
  }

  if (analysis.architecture && typeof analysis.architecture === "object") {
    const arch = analysis.architecture as Record<string, unknown>;
    if (arch.pattern) sections.push(`## Architecture Pattern\n${arch.pattern}`);
    if (arch.dataFlow) sections.push(`## Data Flow\n${arch.dataFlow}`);
    if (Array.isArray(arch.layers) && arch.layers.length > 0) {
      sections.push(`## Layers\n${(arch.layers as string[]).map((l, i) => `${i + 1}. ${l}`).join("\n")}`);
    }
    if (Array.isArray(arch.modules)) {
      const mods = (arch.modules as Array<{ name: string; path: string; responsibility: string }>)
        .map((m) => `- **${m.name}** (${m.path}): ${m.responsibility}`)
        .join("\n");
      if (mods) sections.push(`## Modules\n${mods}`);
    }
  }

  if (Array.isArray(analysis.entryPoints)) {
    const eps = (analysis.entryPoints as Array<{ path: string; score: number }>)
      .slice(0, 10)
      .map((ep) => `- ${ep.path} (importance: ${ep.score})`)
      .join("\n");
    if (eps) sections.push(`## Key Entry Points\n${eps}`);
  }

  if (analysis.fileSummaries && typeof analysis.fileSummaries === "object") {
    const summaries = Object.entries(analysis.fileSummaries as Record<string, string>)
      .slice(0, 30)
      .map(([path, summary]) => `- \`${path}\`: ${summary}`)
      .join("\n");
    if (summaries) sections.push(`## File Summaries\n${summaries}`);
  }

  return sections.join("\n\n");
}
