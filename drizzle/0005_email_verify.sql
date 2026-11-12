-- Email verification for family accounts. Existing accounts count as verified.
ALTER TABLE family_accounts ADD COLUMN email_verified_at INTEGER;
UPDATE family_accounts SET email_verified_at = created_at WHERE email_verified_at IS NULL;
CREATE TABLE IF NOT EXISTS family_email_codes (
 email TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL
);
