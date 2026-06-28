import { z } from "zod";
import { pool } from "../db/pool.js";
import { HttpError } from "../utils/http-error.js";

export const receiverQuerySchema = z.object({
  identifier: z.string().trim().min(3).max(120)
});

type ReceiverRow = {
  id: string;
  name: string;
  email: string;
  wallet_id: string;
  aadhaar_linked: boolean | null;
  kyc_status: "pending" | "verified" | "review" | null;
  upi_id: string | null;
  risk_tier: "standard" | "trusted" | "review" | null;
};

export async function resolveReceiver(identifier: string, currentUserId: string) {
  const parsed = receiverQuerySchema.parse({ identifier });
  const lookup = parsed.identifier.toLowerCase();

  const result = await pool.query<ReceiverRow>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        w.id AS wallet_id,
        k.aadhaar_linked,
        k.kyc_status,
        k.upi_id,
        k.risk_tier
      FROM users u
      JOIN wallets w ON w.user_id = u.id
      LEFT JOIN kyc_profiles k ON k.user_id = u.id
      WHERE lower(u.email) = $1 OR lower(k.upi_id) = $1
      LIMIT 1
    `,
    [lookup]
  );

  const receiver = result.rows[0];
  if (!receiver) {
    throw new HttpError(404, "Receiver not found");
  }

  if (receiver.id === currentUserId) {
    throw new HttpError(400, "Receiver cannot be your own wallet");
  }

  return {
    receiver: {
      userId: receiver.id,
      name: receiver.name,
      email: receiver.email,
      walletId: receiver.wallet_id,
      upiId: receiver.upi_id,
      aadhaarLinked: Boolean(receiver.aadhaar_linked),
      kycStatus: receiver.kyc_status ?? "pending",
      riskTier: receiver.risk_tier ?? "standard",
      rails: ["wallet", "upi-simulated"],
      settlement: "instant-ledger"
    }
  };
}
