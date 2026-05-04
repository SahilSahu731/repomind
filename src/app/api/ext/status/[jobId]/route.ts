import type { NextRequest } from "next/server";
import { corsOk, withCors } from "@/lib/cors";
import { getJobById } from "@/lib/supabaseDb";

export async function OPTIONS(req: NextRequest) {
  return corsOk(req.headers.get("origin"));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const origin = req.headers.get("origin");

  try {
    const { jobId } = await params;

    if (!jobId) {
      return withCors(
        { success: false, error: { code: "INVALID_INPUT", message: "Missing jobId" } },
        origin,
        400
      );
    }

    const job = await getJobById(jobId);

    if (!job) {
      return withCors(
        { success: false, error: { code: "NOT_FOUND", message: "Job not found" } },
        origin,
        404
      );
    }

    return withCors(
      {
        success: true,
        data: {
          jobId: job.id,
          repoId: job.repoId,
          status: job.status,
          progress: job.progress,
          currentStep: job.currentStep ?? "queued",
        },
      },
      origin
    );
  } catch (error: unknown) {
    console.error("[ext/status] Error:", error);
    return withCors(
      { success: false, error: { code: "INTERNAL", message: "Failed to get status" } },
      origin,
      500
    );
  }
}
