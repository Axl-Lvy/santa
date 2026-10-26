/** Ordered migrations; index + 1 is the resulting `user_version`. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE event (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    budget_eur INTEGER,
    drawn_at TEXT
  );
  INSERT INTO event (id) VALUES (1);

  CREATE TABLE participant (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    revealed_at TEXT,
    draw_email_sent_at TEXT,
    activity_enc TEXT
  );

  CREATE TABLE pair_rule (
    a_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    b_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    PRIMARY KEY (a_id, b_id),
    CHECK (a_id < b_id)
  );

  CREATE TABLE assignment_blob (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload_enc TEXT NOT NULL
  );

  -- WITHOUT ROWID: rows sit in random-UUID order, so no hidden rowid keeps the sending order.
  CREATE TABLE anon_message (
    id TEXT PRIMARY KEY,
    payload_enc TEXT NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE group_message (
    id INTEGER PRIMARY KEY,
    author_id INTEGER REFERENCES participant(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE wish (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    detail TEXT,
    url TEXT,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE idea (
    id INTEGER PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    body_enc TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE read_state (
    participant_id INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('giftee', 'santa', 'group', 'ideas')),
    last_read_at_enc TEXT NOT NULL,
    PRIMARY KEY (participant_id, kind)
  ) WITHOUT ROWID;
  `,
];
