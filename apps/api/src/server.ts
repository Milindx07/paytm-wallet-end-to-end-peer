import { createServer } from "node:http";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { ensureRedis, closeRedis } from "./db/redis.js";
import { closePool } from "./db/pool.js";

const app = createApp();
const server = createServer(app);

async function start(): Promise<void> {
  await ensureRedis().catch((error) => {
    console.warn("Redis connection is not ready yet:", error.message);
  });

  server.listen(config.port, () => {
    console.log(`Wallet API listening on http://localhost:${config.port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Closing server...`);
  server.close(async () => {
    await Promise.allSettled([closeRedis(), closePool()]);
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
