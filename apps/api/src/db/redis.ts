import { Redis } from "ioredis";
import { config } from "../config.js";

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

export async function ensureRedis(): Promise<void> {
  if (redis.status === "wait") {
    await redis.connect();
  }
}

export async function closeRedis(): Promise<void> {
  redis.disconnect();
}
