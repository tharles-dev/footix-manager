import { Redis } from "@upstash/redis";
import { ApiError } from "./error";

// Rate limit em memória para fallback
const redis = Redis.fromEnv();

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60
): Promise<void> {
  const key = `rate-limit:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    throw new ApiError({
      message: "Muitas requisições. Tente novamente mais tarde.",
      code: "RATE_LIMIT_EXCEEDED",
      details: {
        limit,
        window,
        remaining: 0,
      },
    });
  }
}
