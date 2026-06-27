import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../utils/http-error.js";
import { formatPaise } from "../utils/money.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(120)
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
};

type WalletRow = {
  id: string;
  user_id: string;
  balance_paise: string;
  currency: string;
};

function serializeWallet(row: WalletRow) {
  return {
    id: row.id,
    userId: row.user_id,
    balancePaise: Number(row.balance_paise),
    balanceDisplay: formatPaise(row.balance_paise),
    currency: row.currency
  };
}

function serializeUser(row: Pick<UserRow, "id" | "name" | "email">) {
  return {
    id: row.id,
    name: row.name,
    email: row.email
  };
}

export async function register(input: z.infer<typeof registerSchema>) {
  const payload = registerSchema.parse(input);
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query<UserRow>(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, password_hash
      `,
      [payload.name, payload.email, passwordHash]
    );

    const walletResult = await client.query<WalletRow>(
      `
        INSERT INTO wallets (user_id, balance_paise)
        VALUES ($1, 0)
        RETURNING id, user_id, balance_paise, currency
      `,
      [userResult.rows[0].id]
    );

    await client.query("COMMIT");

    const user = serializeUser(userResult.rows[0]);
    return {
      token: signToken({
        sub: user.id,
        name: user.name,
        email: user.email
      }),
      user,
      wallet: serializeWallet(walletResult.rows[0])
    };
  } catch (error: any) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error?.code === "23505") {
      throw new HttpError(409, "Email already registered");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function login(input: z.infer<typeof loginSchema>) {
  const payload = loginSchema.parse(input);
  const userResult = await pool.query<UserRow>(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [payload.email]
  );

  const userRow = userResult.rows[0];
  if (!userRow) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(
    payload.password,
    userRow.password_hash
  );

  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  const walletResult = await pool.query<WalletRow>(
    "SELECT id, user_id, balance_paise, currency FROM wallets WHERE user_id = $1",
    [userRow.id]
  );

  const user = serializeUser(userRow);
  return {
    token: signToken({
      sub: user.id,
      name: user.name,
      email: user.email
    }),
    user,
    wallet: serializeWallet(walletResult.rows[0])
  };
}

export { serializeUser, serializeWallet };
