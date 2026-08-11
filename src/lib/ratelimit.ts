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

interface MemoryWindow {
  count: number;
  resetsAt: number;
}

const memoryWindows = new Map<string, MemoryWindow>();
const maxMemoryWindows = 10_000;
let warnedAboutMemoryFallback = false;

function limitInMemory(key: string, maximum: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = memoryWindows.get(key);

  if (!existing || existing.resetsAt <= now) {
    if (memoryWindows.size >= maxMemoryWindows) {
      for (const [storedKey, window] of memoryWindows) {
        if (window.resetsAt <= now) memoryWindows.delete(storedKey);
      }

      if (memoryWindows.size >= maxMemoryWindows) {
        const oldestKey = memoryWindows.keys().next().value;
        if (typeof oldestKey === "string") memoryWindows.delete(oldestKey);
      }
    }

    memoryWindows.set(key, { count: 1, resetsAt: now + windowMs });
    return true;
  }

  if (existing.count >= maximum) {
    return false;
  }

  existing.count += 1;
  memoryWindows.set(key, existing);
  return true;
}

function announceMemoryFallback(): void {
  if (warnedAboutMemoryFallback) return;
  console.warn(
    "Upstash rate limiting is not configured; using a single-instance in-memory limiter."
  );
  warnedAboutMemoryFallback = true;
}

export async function limitAnalyze(userId: string, isPro: boolean): Promise<boolean> {
  const limiter = isPro ? proLimiter : freeLimiter;
  if (!limiter) {
    announceMemoryFallback();
    return limitInMemory(
      `analyze:${isPro ? "pro" : "free"}:${userId}`,
      isPro ? 30 : 3,
      24 * 60 * 60 * 1000
    );
  }

  const result = await limiter.limit(userId);
  return result.success;
}

export async function limitGlobal(identifier: string): Promise<boolean> {
  if (!globalLimiter) {
    announceMemoryFallback();
    return limitInMemory(`global:${identifier}`, 100, 60 * 1000);
  }

  const result = await globalLimiter.limit(identifier);
  return result.success;
}
