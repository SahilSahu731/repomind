import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  redisClient = new Redis({ url, token });
  return redisClient;
}
