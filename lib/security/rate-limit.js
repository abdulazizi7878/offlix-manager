import { getRedis } from "./redis";

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("TTL", KEYS[1])

return { current, ttl }
`;

export async function rateLimit(
  request,
  {
    key,
    limit,
    windowSeconds,
  }
) {
  const redis = await getRedis();

  const forwardedFor =
    request.headers.get("x-forwarded-for");

  const realIp =
    request.headers.get("x-real-ip");

  const ip =
    forwardedFor?.split(",")[0].trim() ||
    realIp?.trim() ||
    "unknown";

  const redisKey = `rate_limit:${key}:${ip}`;

  const result = await redis.eval(
    RATE_LIMIT_SCRIPT,
    [redisKey],
    [String(windowSeconds)]
  );

  const currentCount = Number(result[0]);
  const ttl = Number(result[1]);

  const retryAfter = Math.max(0, ttl);

  return {
    allowed: currentCount <= limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
    retryAfter,
    resetAt: Date.now() + retryAfter * 1000,
  };
}