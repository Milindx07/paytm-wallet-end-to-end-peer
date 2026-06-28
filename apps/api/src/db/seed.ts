import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const users = [
  {
    name: "Milan",
    email: "milan@example.com",
    balancePaise: 250_000
  },
  {
    name: "Aisha",
    email: "aisha@example.com",
    balancePaise: 125_000
  },
  {
    name: "Rohan",
    email: "rohan@example.com",
    balancePaise: 90_000
  }
];

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", 12);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const user of users) {
      const insertedUser = await client.query<{ id: string }>(
        `
          INSERT INTO users (name, email, password_hash)
          VALUES ($1, $2, $3)
          ON CONFLICT (email)
          DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `,
        [user.name, user.email, passwordHash]
      );

      await client.query(
        `
          INSERT INTO wallets (user_id, balance_paise)
          VALUES ($1, $2)
          ON CONFLICT (user_id)
          DO UPDATE SET balance_paise = EXCLUDED.balance_paise
        `,
        [insertedUser.rows[0].id, user.balancePaise]
      );

      await client.query(
        `
          INSERT INTO kyc_profiles (
            user_id,
            aadhaar_last4,
            aadhaar_linked,
            kyc_status,
            upi_id,
            bank_name,
            risk_tier,
            consent_accepted_at
          )
          VALUES ($1, $2, true, 'verified', $3, 'Paytm Payments Bank simulator', 'trusted', now())
          ON CONFLICT (user_id)
          DO UPDATE SET
            aadhaar_last4 = EXCLUDED.aadhaar_last4,
            aadhaar_linked = true,
            kyc_status = 'verified',
            upi_id = EXCLUDED.upi_id,
            bank_name = EXCLUDED.bank_name,
            risk_tier = 'trusted',
            consent_accepted_at = now()
        `,
        [
          insertedUser.rows[0].id,
          user.email === "milan@example.com"
            ? "4321"
            : user.email === "aisha@example.com"
              ? "8842"
              : "7120",
          `${user.email.split("@")[0]}@wallet`
        ]
      );
    }

    await client.query("COMMIT");
    console.log("Seeded demo users with password password123");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
