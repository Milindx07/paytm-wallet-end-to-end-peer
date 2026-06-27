import { z } from "zod";
import { pool, type DbClient } from "../db/pool.js";
import { redis } from "../db/redis.js";
import { HttpError } from "../utils/http-error.js";
import { formatPaise } from "../utils/money.js";
import { serializeWallet } from "./auth.service.js";

export const transferSchema = z.object({
  receiverEmail: z.string().trim().email().toLowerCase(),
  amountPaise: z.number().int().min(100).max(1_000_000_00),
  note: z.string().trim().max(160).optional()
});

type WalletRow = {
  id: string;
  user_id: string;
  balance_paise: string;
  currency: string;
  email?: string;
  name?: string;
};

type TransactionRow = {
  id: string;
  amount_paise: string;
  status: "pending" | "completed" | "failed";
  note: string | null;
  created_at: string;
};

const walletCacheKey = (userId: string) => `wallet:${userId}`;
const transferKey = (userId: string, key: string) =>
  `idempotency:transfer:${userId}:${key}`;

async function getSenderWallet(client: DbClient, userId: string) {
  const result = await client.query<WalletRow>(
    `
      SELECT w.id, w.user_id, w.balance_paise, w.currency, u.email, u.name
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE w.user_id = $1
    `,
    [userId]
  );
  return result.rows[0];
}

async function getReceiverWallet(client: DbClient, receiverEmail: string) {
  const result = await client.query<WalletRow>(
    `
      SELECT w.id, w.user_id, w.balance_paise, w.currency, u.email, u.name
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE u.email = $1
    `,
    [receiverEmail]
  );
  return result.rows[0];
}

async function lockWallets(client: DbClient, walletIds: string[]) {
  const result = await client.query<WalletRow>(
    `
      SELECT id, user_id, balance_paise, currency
      FROM wallets
      WHERE id = ANY($1::uuid[])
      ORDER BY id
      FOR UPDATE
    `,
    [walletIds]
  );

  return new Map(result.rows.map((row) => [row.id, row]));
}

export async function transferMoney(
  userId: string,
  input: z.infer<typeof transferSchema>,
  idempotencyKey: string | undefined
) {
  if (!idempotencyKey?.trim()) {
    throw new HttpError(400, "Idempotency-Key header is required");
  }

  const payload = transferSchema.parse(input);
  const redisKey = transferKey(userId, idempotencyKey);
  const acquired = await redis.set(
    redisKey,
    JSON.stringify({ status: "processing" }),
    "EX",
    300,
    "NX"
  );

  if (acquired !== "OK") {
    const existing = await redis.get(redisKey);
    if (!existing) {
      throw new HttpError(409, "Transfer is already being processed");
    }

    const parsed = JSON.parse(existing);
    if (parsed.status === "completed") {
      return parsed.response;
    }

    throw new HttpError(409, "Transfer is already being processed");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");

    const sender = await getSenderWallet(client, userId);
    const receiver = await getReceiverWallet(client, payload.receiverEmail);

    if (!sender) {
      throw new HttpError(404, "Sender wallet not found");
    }

    if (!receiver) {
      throw new HttpError(404, "Receiver wallet not found");
    }

    if (sender.user_id === receiver.user_id) {
      throw new HttpError(400, "Cannot transfer to your own wallet");
    }

    const locked = await lockWallets(client, [sender.id, receiver.id]);
    const lockedSender = locked.get(sender.id);
    const lockedReceiver = locked.get(receiver.id);

    if (!lockedSender || !lockedReceiver) {
      throw new HttpError(404, "Wallet lock failed");
    }

    const senderBalance = Number(lockedSender.balance_paise);
    const receiverBalance = Number(lockedReceiver.balance_paise);

    if (senderBalance < payload.amountPaise) {
      throw new HttpError(400, "Insufficient balance");
    }

    const nextSenderBalance = senderBalance - payload.amountPaise;
    const nextReceiverBalance = receiverBalance + payload.amountPaise;

    const senderUpdate = await client.query<WalletRow>(
      `
        UPDATE wallets
        SET balance_paise = $1
        WHERE id = $2
        RETURNING id, user_id, balance_paise, currency
      `,
      [nextSenderBalance, sender.id]
    );

    await client.query(
      `
        UPDATE wallets
        SET balance_paise = $1
        WHERE id = $2
      `,
      [nextReceiverBalance, receiver.id]
    );

    const transaction = await client.query<TransactionRow>(
      `
        INSERT INTO transactions (
          sender_wallet_id,
          receiver_wallet_id,
          amount_paise,
          status,
          note,
          idempotency_key
        )
        VALUES ($1, $2, $3, 'completed', $4, $5)
        RETURNING id, amount_paise, status, note, created_at
      `,
      [
        sender.id,
        receiver.id,
        payload.amountPaise,
        payload.note ?? null,
        idempotencyKey
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
        VALUES
          ($1, $2, 'debit', $4, $5),
          ($1, $3, 'credit', $4, $6)
      `,
      [
        transaction.rows[0].id,
        sender.id,
        receiver.id,
        payload.amountPaise,
        nextSenderBalance,
        nextReceiverBalance
      ]
    );

    await client.query("COMMIT");

    const response = {
      transaction: {
        id: transaction.rows[0].id,
        type: "debit" as const,
        counterpartyName: receiver.name ?? "Receiver",
        counterpartyEmail: receiver.email ?? payload.receiverEmail,
        amountPaise: payload.amountPaise,
        amountDisplay: formatPaise(payload.amountPaise),
        status: "completed" as const,
        note: payload.note ?? null,
        createdAt: transaction.rows[0].created_at
      },
      wallet: serializeWallet(senderUpdate.rows[0])
    };

    await redis
      .multi()
      .del(walletCacheKey(userId))
      .del(walletCacheKey(receiver.user_id))
      .set(redisKey, JSON.stringify({ status: "completed", response }), "EX", 3600)
      .exec()
      .catch(() => undefined);

    return response;
  } catch (error: any) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (error?.code === "23505") {
      throw new HttpError(409, "Idempotency key has already been used");
    }

    await redis.del(redisKey).catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
