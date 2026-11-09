-- Friends: approved friendships, end-to-end encrypted messages, call set-up.
CREATE TABLE friend_members (
 member_id TEXT PRIMARY KEY, family_id TEXT NOT NULL, name TEXT NOT NULL,
 code TEXT NOT NULL UNIQUE, public_key TEXT, updated_at INTEGER NOT NULL
);
CREATE TABLE friendships (
 id TEXT PRIMARY KEY, a TEXT NOT NULL, b TEXT NOT NULL, requested_by TEXT NOT NULL,
 accepted INTEGER NOT NULL DEFAULT 0, a_parent_ok INTEGER NOT NULL DEFAULT 0, b_parent_ok INTEGER NOT NULL DEFAULT 0,
 blocked_by TEXT, created_at INTEGER NOT NULL, UNIQUE(a, b)
);
CREATE INDEX friendships_a ON friendships(a);
CREATE INDEX friendships_b ON friendships(b);
-- Ciphertext only: the server cannot read messages.
CREATE TABLE friend_messages (
 id TEXT PRIMARY KEY, friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
 sender TEXT NOT NULL, ciphertext TEXT NOT NULL, iv TEXT NOT NULL, sent_at INTEGER NOT NULL
);
CREATE INDEX friend_messages_thread ON friend_messages(friendship_id, sent_at);
CREATE TABLE friend_signals (
 id INTEGER PRIMARY KEY AUTOINCREMENT, to_member TEXT NOT NULL, from_member TEXT NOT NULL,
 kind TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX friend_signals_to ON friend_signals(to_member, id);
CREATE TABLE friend_reports (
 id TEXT PRIMARY KEY, friendship_id TEXT NOT NULL, reporter TEXT NOT NULL, excerpt TEXT NOT NULL, created_at INTEGER NOT NULL
);
