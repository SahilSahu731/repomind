import { db } from "@/lib/db";
import { getRedisClient } from "@/lib/redis";
import { ok, fail } from "@/lib/api";
import { getApiError } from "@/lib/errors";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
    }

    return ok({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        redis: redis ? "up" : "not-configured",
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
