import { pool } from "../db/pool.js";
import { formatPaise } from "../utils/money.js";

type TransactionListRow = {
  id: string;
  type: "credit" | "debit";
  counterparty_name: string | null;
  counterparty_email: string | null;
  amount_paise: string;
  status: "pending" | "completed" | "failed";
  note: string | null;
  created_at: string;
};

export async function listTransactions(userId: string, limit = 20) {
  const result = await pool.query<TransactionListRow>(
    `
      WITH current_wallet AS (
        SELECT id FROM wallets WHERE user_id = $1
      )
      SELECT
        t.id,
        CASE
          WHEN t.sender_wallet_id = cw.id THEN 'debit'
          ELSE 'credit'
        END AS type,
        cp.name AS counterparty_name,
        cp.email AS counterparty_email,
        t.amount_paise,
        t.status,
        t.note,
        t.created_at
      FROM transactions t
      JOIN current_wallet cw
        ON t.sender_wallet_id = cw.id OR t.receiver_wallet_id = cw.id
      LEFT JOIN wallets other_wallet
        ON other_wallet.id = CASE
          WHEN t.sender_wallet_id = cw.id THEN t.receiver_wallet_id
          ELSE t.sender_wallet_id
        END
      LEFT JOIN users cp
        ON cp.id = other_wallet.user_id
      ORDER BY t.created_at DESC
      LIMIT $2
    `,
    [userId, Math.min(Math.max(limit, 1), 100)]
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    counterpartyName:
      row.counterparty_name ?? (row.type === "credit" ? "Wallet top-up" : "Unknown"),
    counterpartyEmail: row.counterparty_email ?? "system@wallet.local",
    amountPaise: Number(row.amount_paise),
    amountDisplay: formatPaise(row.amount_paise),
    status: row.status,
    note: row.note,
    createdAt: row.created_at
  }));
}
