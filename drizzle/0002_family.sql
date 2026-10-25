PRAGMA foreign_keys = ON;
CREATE TABLE family_accounts (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, consent_at INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE family_children (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
 name TEXT NOT NULL, age INTEGER NOT NULL CHECK(age BETWEEN 4 AND 17), character TEXT NOT NULL DEFAULT 'kai', created_at INTEGER NOT NULL
);
CREATE INDEX family_children_owner ON family_children(family_id);
CREATE TABLE family_sessions (
 token_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
 child_id TEXT REFERENCES family_children(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL
);
CREATE INDEX family_sessions_expiry ON family_sessions(expires_at);
CREATE TABLE learning_results (
 child_id TEXT NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL, game_id TEXT NOT NULL, score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100), completed_at INTEGER NOT NULL,
 PRIMARY KEY(child_id,event_id)
);
CREATE INDEX learning_results_child_date ON learning_results(child_id,completed_at);
CREATE TABLE family_auth_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
