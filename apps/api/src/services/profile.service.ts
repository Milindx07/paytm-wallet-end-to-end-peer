import { z } from "zod";
import { pool } from "../db/pool.js";
import { HttpError } from "../utils/http-error.js";

export const linkAadhaarSchema = z.object({
  aadhaarLast4: z.string().regex(/^[0-9]{4}$/),
  consentAccepted: z.literal(true),
  upiId: z.string().trim().min(6).max(80).optional()
});

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  aadhaar_last4: string | null;
  aadhaar_linked: boolean | null;
  kyc_status: "pending" | "verified" | "review" | null;
  upi_id: string | null;
  bank_name: string | null;
  risk_tier: "standard" | "trusted" | "review" | null;
  consent_accepted_at: string | null;
};

function maskedAadhaar(last4: string | null): string | null {
  return last4 ? `XXXX XXXX ${last4}` : null;
}

function serializeProfile(row: ProfileRow) {
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email
    },
    kyc: {
      aadhaarLinked: Boolean(row.aadhaar_linked),
      aadhaarMasked: maskedAadhaar(row.aadhaar_last4),
      kycStatus: row.kyc_status ?? "pending",
      upiId: row.upi_id,
      bankName: row.bank_name ?? "Paytm Payments Bank simulator",
      riskTier: row.risk_tier ?? "standard",
      consentAcceptedAt: row.consent_accepted_at
    }
  };
}

export async function getProfile(userId: string) {
  const result = await pool.query<ProfileRow>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        k.aadhaar_last4,
        k.aadhaar_linked,
        k.kyc_status,
        k.upi_id,
        k.bank_name,
        k.risk_tier,
        k.consent_accepted_at
      FROM users u
      LEFT JOIN kyc_profiles k ON k.user_id = u.id
      WHERE u.id = $1
    `,
    [userId]
  );

  if (!result.rows[0]) {
    throw new HttpError(404, "Profile not found");
  }

  const profile = serializeProfile(result.rows[0]);
  return {
    message: `${profile.user.name}'s profile is ready with ${profile.kyc.kycStatus} KYC status.`,
    ...profile
  };
}

export async function linkAadhaar(
  userId: string,
  input: z.infer<typeof linkAadhaarSchema>
) {
  const payload = linkAadhaarSchema.parse(input);
  const userResult = await pool.query<{ email: string }>(
    "SELECT email FROM users WHERE id = $1",
    [userId]
  );

  if (!userResult.rows[0]) {
    throw new HttpError(404, "User not found");
  }

  const defaultUpi =
    payload.upiId ??
    `${userResult.rows[0].email.split("@")[0].replace(/[^a-z0-9._-]/gi, "")}@wallet`;

  await pool.query(
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
    [userId, payload.aadhaarLast4, defaultUpi.toLowerCase()]
  );

  const profile = await getProfile(userId);
  return {
    ...profile,
    message:
      "Aadhaar-style KYC has been linked using masked storage. Full Aadhaar numbers are not stored."
  };
}
