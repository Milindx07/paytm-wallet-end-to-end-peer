import { pool } from "../db/pool.js";
import { redis } from "../db/redis.js";

export async function getOpsSnapshot(userId: string) {
  const [db, redisPing] = await Promise.allSettled([
    pool.query("SELECT now() AS checked_at"),
    redis.ping()
  ]);

  const walletResult = await pool.query<{ balance_paise: string }>(
    "SELECT balance_paise FROM wallets WHERE user_id = $1",
    [userId]
  );

  return {
    source: "backend",
    status:
      db.status === "fulfilled" && redisPing.status === "fulfilled"
        ? "ready"
        : "degraded",
    postgres:
      db.status === "fulfilled"
        ? { status: "ok", checkedAt: db.value.rows[0].checked_at }
        : { status: "down" },
    redis:
      redisPing.status === "fulfilled"
        ? { status: "ok", response: redisPing.value }
        : { status: "down" },
    walletBalancePaise: Number(walletResult.rows[0]?.balance_paise ?? 0)
  };
}

export function getIsolationDetails() {
  return {
    source: "backend",
    title: "PostgreSQL row-level locking",
    isolationLevel: "REPEATABLE READ",
    lockOrder: "wallet UUID ascending",
    lockStatement:
      "SELECT id, user_id, balance_paise FROM wallets WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
    prevents: [
      "double spending",
      "lost updates",
      "negative balance race conditions",
      "sender/receiver ledger mismatch"
    ]
  };
}

export function getRetrySafetyDetails() {
  return {
    source: "backend",
    title: "Redis idempotency guard",
    idempotencyKeyScope: "idempotency:transfer:{userId}:{key}",
    processingTtlSeconds: 300,
    completedTtlSeconds: 3600,
    behavior: [
      "first request reserves the key with NX",
      "same completed key returns the original transaction",
      "in-flight duplicate receives HTTP 409",
      "failed transaction releases the key for safe retry"
    ]
  };
}
