CREATE TABLE IF NOT EXISTS kyc_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  aadhaar_last4 TEXT CHECK (aadhaar_last4 ~ '^[0-9]{4}$'),
  aadhaar_linked BOOLEAN NOT NULL DEFAULT false,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'review')),
  upi_id TEXT UNIQUE,
  bank_name TEXT,
  risk_tier TEXT NOT NULL DEFAULT 'standard' CHECK (risk_tier IN ('standard', 'trusted', 'review')),
  consent_accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kyc_touch_updated_at ON kyc_profiles;

CREATE TRIGGER kyc_touch_updated_at
BEFORE UPDATE ON kyc_profiles
FOR EACH ROW
EXECUTE FUNCTION touch_kyc_updated_at();
