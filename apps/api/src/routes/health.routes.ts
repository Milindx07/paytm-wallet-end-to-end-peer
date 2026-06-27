import { Router } from "express";
import { pool } from "../db/pool.js";
import { redis } from "../db/redis.js";

export const healthRoutes = Router();

healthRoutes.get("/", async (_req, res) => {
  const checks = {
    postgres: "unknown",
    redis: "unknown"
  };

  try {
    await pool.query("SELECT 1");
    checks.postgres = "ok";
  } catch {
    checks.postgres = "down";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "down";
  }

  const isHealthy = checks.postgres === "ok" && checks.redis === "ok";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    ...checks,
    uptime: process.uptime()
  });
});
