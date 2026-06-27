import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { redis } from "../db/redis.js";
import { HttpError } from "../utils/http-error.js";
import { formatPaise } from "../utils/money.js";
import { serializeWallet } from "./auth.service.js";

export const addMoneySchema = z.object({
  amountPaise: z.number().int().min(100).max(1_000_000_00)
});

type WalletRow = {
  id: string;
  user_id: string;
  balance_paise: string;
  currency: string;
};

const walletCacheKey = (userId: string) => `wallet:${userId}`;

export async function getWallet(userId: string) {
  const cached = await redis.get(walletCacheKey(userId)).catch(() => null);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await pool.query<WalletRow>(
    "SELECT id, user_id, balance_paise, currency FROM wallets WHERE user_id = $1",
    [userId]
  );

  if (!result.rows[0]) {
    throw new HttpError(404, "Wallet not found");
  }

  const wallet = serializeWallet(result.rows[0]);
  await redis.set(walletCacheKey(userId), JSON.stringify(wallet), "EX", 20).catch(
    () => undefined
  );
  return wallet;
}

export async function addMoney(
  userId: string,
  input: z.infer<typeof addMoneySchema>,
  idempotencyKey?: string
) {
  const payload = addMoneySchema.parse(input);
  const key = idempotencyKey
    ? `idempotency:add-money:${userId}:${idempotencyKey}`
    : undefined;

  if (key) {
    const existing = await redis.get(key);
    if (existing) {
      return JSON.parse(existing);
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");

    const locked = await client.query<WalletRow>(
      `
        SELECT id, user_id, balance_paise, currency
        FROM wallets
        WHERE user_id = $1
        FOR UPDATE
      `,
      [userId]
    );

    if (!locked.rows[0]) {
      throw new HttpError(404, "Wallet not found");
    }

    const updated = await client.query<WalletRow>(
      `
        UPDATE wallets
        SET balance_paise = balance_paise + $1
        WHERE id = $2
        RETURNING id, user_id, balance_paise, currency
      `,
      [payload.amountPaise, locked.rows[0].id]
    );

    const transaction = await client.query<{ id: string }>(
      `
        INSERT INTO transactions (
          sender_wallet_id,
          receiver_wallet_id,
          amount_paise,
          status,
          note,
          idempotency_key
        )
        VALUES (NULL, $1, $2, 'completed', 'Wallet top-up', $3)
        RETURNING id
      `,
      [
        locked.rows[0].id,
        payload.amountPaise,
        idempotencyKey ?? `topup-${userId}-${randomUUID()}`
      ]
    );

    await client.query(
      `
        INSERT INTO ledger_entries (
          transaction_id,
          wallet_id,
          entry_type,
          amount_paise,
          balance_after_paise
        )
        VALUES ($1, $2, 'credit', $3, $4)
      `,
      [
        transaction.rows[0].id,
        updated.rows[0].id,
        payload.amountPaise,
        updated.rows[0].balance_paise
      ]
    );

    await client.query("COMMIT");

    const response = {
      wallet: {
        ...serializeWallet(updated.rows[0]),
        balanceDisplay: formatPaise(updated.rows[0].balance_paise)
      }
    };

    await redis
      .multi()
      .del(walletCacheKey(userId))
      .set(key ?? `noop:${randomUUID()}`, JSON.stringify(response), "EX", 3600)
      .exec()
      .catch(() => undefined);

    return response;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
