-- Kharis Church identity and serving points for KairosGames players. Private schema,
-- reached only through the kairos-family Edge Function (same model as the family tables).
CREATE TABLE IF NOT EXISTS kairos_games.kharis_members (
 owner_id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES kairos_games.family_accounts(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(char_length(name) BETWEEN 1 AND 20), branch TEXT NOT NULL CHECK(char_length(branch) <= 20),
 department TEXT CHECK(department IS NULL OR char_length(department) <= 20), updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS kharis_members_family ON kairos_games.kharis_members(family_id);
CREATE TABLE IF NOT EXISTS kairos_games.kharis_activity (
 owner_id TEXT NOT NULL REFERENCES kairos_games.kharis_members(owner_id) ON DELETE CASCADE,
 event_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('serve','sermon')), ref TEXT NOT NULL CHECK(char_length(ref) <= 40),
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100), branch TEXT NOT NULL, completed_at BIGINT NOT NULL,
 PRIMARY KEY(owner_id, event_id)
);
CREATE INDEX IF NOT EXISTS kharis_activity_branch_date ON kairos_games.kharis_activity(branch, completed_at DESC);
ALTER TABLE kairos_games.kharis_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kairos_games.kharis_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kairos_games.kharis_members, kairos_games.kharis_activity FROM PUBLIC, anon, authenticated;
