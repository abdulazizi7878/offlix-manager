import { Redis } from "@upstash/redis";

const globalForRedis = globalThis;

const redis =
  globalForRedis.upstashRedis ??
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

if (!globalForRedis.upstashRedis) {
  globalForRedis.upstashRedis = redis;
}

export async function getRedis() {
  return redis;
}

export default redis;