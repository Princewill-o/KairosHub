-- Separate from the existing Kharis application's public tables and Auth users.
CREATE SCHEMA kairos_games;
REVOKE ALL ON SCHEMA kairos_games FROM PUBLIC, anon, authenticated;
CREATE TABLE kairos_games.family_accounts (
 id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(char_length(name) BETWEEN 1 AND 20),
 email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL,
 consent_at BIGINT NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE kairos_games.family_children (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES kairos_games.family_accounts(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(char_length(name) BETWEEN 1 AND 20), age INTEGER NOT NULL CHECK(age BETWEEN 4 AND 17),
 character TEXT NOT NULL DEFAULT 'kai' CHECK(character IN ('kai','ama','leo','mei','theo')), created_at BIGINT NOT NULL
);
CREATE INDEX family_children_owner ON kairos_games.family_children(family_id);
CREATE TABLE kairos_games.family_sessions (
 token_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES kairos_games.family_accounts(id) ON DELETE CASCADE,
 child_id TEXT REFERENCES kairos_games.family_children(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL
);
CREATE INDEX family_sessions_expiry ON kairos_games.family_sessions(expires_at);
CREATE INDEX family_sessions_family ON kairos_games.family_sessions(family_id);
CREATE INDEX family_sessions_child ON kairos_games.family_sessions(child_id);
CREATE TABLE kairos_games.learning_results (
 child_id TEXT NOT NULL REFERENCES kairos_games.family_children(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL, game_id TEXT NOT NULL CHECK(game_id IN ('trivia','quiz','word-search','crossword','charades','memory','verse','jeopardy','pictionary','hangman','bingo','scavenger','character','ordering','map','escape')),
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100), completed_at BIGINT NOT NULL,
 PRIMARY KEY(child_id,event_id)
);
CREATE INDEX learning_results_child_date ON kairos_games.learning_results(child_id,completed_at DESC);
CREATE TABLE kairos_games.family_auth_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL);
CREATE INDEX family_auth_limits_expiry ON kairos_games.family_auth_limits(expires_at);
ALTER TABLE kairos_games.family_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kairos_games.family_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE kairos_games.family_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kairos_games.learning_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE kairos_games.family_auth_limits ENABLE ROW LEVEL SECURITY;
-- Only the trusted Edge Function database connection can access this schema.
-- No PUBLIC/anon/authenticated policy is intentional; browser Data API access is denied.
REVOKE ALL ON ALL TABLES IN SCHEMA kairos_games FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA kairos_games REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
COMMENT ON SCHEMA kairos_games IS 'Private KairosGames family backend. Access only through the kairos-family Edge Function with password and scoped-session authorization.';
