import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redisUrl = env.UPSTASH_REDIS_REST_URL ?? "";
const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? "";

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

const freeLimiter =
  redis !== null
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 d"),
        prefix: "ratelimit:analyze",
      })
    : null;

const proLimiter =
  redis !== null
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 d"),
        prefix: "ratelimit:analyze:pro",
      })
    : null;

const globalLimiter =
  redis !== null
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:global",
      })
    : null;

export async function limitAnalyze(userId: string, isPro: boolean): Promise<boolean> {
  const limiter = isPro ? proLimiter : freeLimiter;
  if (!limiter) {
    return true;
  }

  const result = await limiter.limit(userId);
  return result.success;
}

export async function limitGlobal(identifier: string): Promise<boolean> {
  if (!globalLimiter) {
    return true;
  }

  const result = await globalLimiter.limit(identifier);
  return result.success;
}
