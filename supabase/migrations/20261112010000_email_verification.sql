-- Email verification for KairosGames family accounts. Existing accounts count as verified.
ALTER TABLE kairos_games.family_accounts ADD COLUMN IF NOT EXISTS email_verified_at BIGINT;
UPDATE kairos_games.family_accounts SET email_verified_at = created_at WHERE email_verified_at IS NULL;
CREATE TABLE IF NOT EXISTS kairos_games.family_email_codes (
 email TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES kairos_games.family_accounts(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL, expires_at BIGINT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS family_email_codes_account ON kairos_games.family_email_codes(account_id);
ALTER TABLE kairos_games.family_email_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kairos_games.family_email_codes FROM PUBLIC, anon, authenticated;
