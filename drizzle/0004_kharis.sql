-- Kharis Church identity (branch, department name tag) and serving / sermon-game points.
CREATE TABLE IF NOT EXISTS kharis_members (
 owner_id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
 name TEXT NOT NULL, branch TEXT NOT NULL, department TEXT, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS kharis_members_family ON kharis_members(family_id);
CREATE TABLE IF NOT EXISTS kharis_activity (
 owner_id TEXT NOT NULL REFERENCES kharis_members(owner_id) ON DELETE CASCADE,
 event_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('serve','sermon')), ref TEXT NOT NULL,
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100), branch TEXT NOT NULL, completed_at INTEGER NOT NULL,
 PRIMARY KEY(owner_id, event_id)
);
CREATE INDEX IF NOT EXISTS kharis_activity_branch_date ON kharis_activity(branch, completed_at DESC);
