import { checkSupabaseDatabaseHealth } from "@/lib/supabaseDb";
import { getRedisClient } from "@/lib/redis";
import { ok, fail } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { shouldUseLocalWorkspaceDatabase } from "@/lib/runtimeMode";

export async function GET() {
  try {
    const isLocalWorkspace = shouldUseLocalWorkspaceDatabase();
    await checkSupabaseDatabaseHealth();
    const redis = getRedisClient();
    if (!isLocalWorkspace && redis) {
      await redis.ping();
    }

    return ok({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: isLocalWorkspace ? "local-file" : "supabase-up",
        analysisQueue: isLocalWorkspace ? "inline" : "bullmq",
        upstash: !isLocalWorkspace && redis ? "up" : "not-used",
      },
    });
  } catch (error) {
    const healthError = getApiError(
      "HEALTH_CHECK_FAILED",
      `Health check failed: ${String(error)}`
    );
    return fail(healthError.code, healthError.message, healthError.status);
  }
}
