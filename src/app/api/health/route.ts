import { checkSupabaseDatabaseHealth } from "@/lib/supabaseDb";
import { getRedisClient } from "@/lib/redis";
import { shouldUseLocalWorkspaceDatabase } from "@/lib/runtimeMode";
import { env } from "@/lib/env";
import type {
  HealthSnapshot,
  HealthState,
  ServiceHealth,
} from "@/types/health";
import IORedis from "ioredis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function inspectService(
  name: string,
  detail: string,
  check: () => Promise<unknown>
): Promise<ServiceHealth> {
  const startedAt = performance.now();

  try {
    await check();
    return {
      name,
      state: "operational",
      detail,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      name,
      state: "outage",
      detail: `${detail} did not respond to the health probe.`,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

async function checkAnalysisQueue(isLocalWorkspace: boolean): Promise<ServiceHealth> {
  if (isLocalWorkspace || env.ANALYSIS_EXECUTION_MODE === "inline") {
    return {
      name: "Analysis engine",
      state: "operational",
      detail: "Jobs are processed inline by this application instance.",
      latencyMs: null,
    };
  }

  return inspectService(
    "Analysis queue",
    "The BullMQ Redis connection",
    async () => {
      const client = new IORedis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
        lazyConnect: true,
        connectTimeout: 3_000,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
      });

      try {
        await client.connect();
        await client.ping();
      } finally {
        client.disconnect();
      }
    }
  );
}

async function checkRateLimiter(): Promise<ServiceHealth> {
  const redis = getRedisClient();
  if (!redis) {
    return {
      name: "Rate limiting",
      state: "degraded",
      detail: "Using per-instance memory limits; limits are not shared across servers.",
      latencyMs: null,
    };
  }

  return inspectService("Rate limiting", "The shared Upstash limiter", () => redis.ping());
}

export async function GET() {
  const isLocalWorkspace = shouldUseLocalWorkspaceDatabase();
  const [storage, analysis, rateLimit] = await Promise.all([
    inspectService(
      isLocalWorkspace ? "Local workspace" : "Supabase database",
      isLocalWorkspace
        ? "The development workspace file is readable"
        : "The primary workspace database",
      checkSupabaseDatabaseHealth
    ),
    checkAnalysisQueue(isLocalWorkspace),
    checkRateLimiter(),
  ]);
  const services = [storage, analysis, rateLimit];
  const status: HealthState = services.some((service) => service.state === "outage")
    ? "outage"
    : services.some((service) => service.state === "degraded")
      ? "degraded"
      : "operational";
  const snapshot: HealthSnapshot = {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    runtime: {
      storage: isLocalWorkspace ? "local-file" : "supabase",
      analysis:
        isLocalWorkspace || env.ANALYSIS_EXECUTION_MODE === "inline" ? "inline" : "bullmq",
      rateLimit: getRedisClient() ? "upstash" : "memory",
    },
    services,
  };

  return NextResponse.json(
    { success: status !== "outage", data: snapshot },
    {
      status: status === "outage" ? 503 : 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
