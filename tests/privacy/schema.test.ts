import { testDb } from "@/test-utils/db";

const allowed = [
  "event.id",
  "event.budget_eur",
  "event.drawn_at",
  "participant.id",
  "participant.first_name",
  "participant.email",
  "participant.revealed_at",
  "participant.draw_email_sent_at",
  "participant.activity_enc",
  "pair_rule.a_id",
  "pair_rule.b_id",
  "assignment_blob.id",
  "assignment_blob.payload_enc",
  "anon_message.id",
  "anon_message.payload_enc",
  "group_message.id",
  "group_message.author_id",
  "group_message.author_name",
  "group_message.body",
  "group_message.created_at",
  "wish.id",
  "wish.owner_id",
  "wish.title",
  "wish.detail",
  "wish.url",
  "wish.position",
  "wish.created_at",
  "wish.updated_at",
  "idea.id",
  "idea.author_id",
  "idea.target_id",
  "idea.body_enc",
  "idea.created_at",
  "idea.updated_at",
  "read_state.participant_id",
  "read_state.kind",
  "read_state.last_read_at_enc",
];

describe("privacy rules 1-3: schema", () => {
  it("has exactly the reviewed plaintext columns", () => {
    const db = testDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .pluck()
      .all() as string[];
    const columns = tables.flatMap((t) =>
      (db.pragma(`table_info(${t})`) as { name: string }[]).map((c) => `${t}.${c.name}`),
    );
    const unexpected = columns.filter((c) => !allowed.includes(c));
    expect(
      unexpected,
      "new column: check privacy rules 1–3 before adding it to the allow-list",
    ).toEqual([]);
    expect(columns.sort()).toEqual([...allowed].sort());
  });
});

describe("privacy rule 3: no hidden insertion order", () => {
  it("keeps read state and anonymous messages in key order, not insertion order", () => {
    const db = testDb();
    for (const table of ["read_state", "anon_message"]) {
      const sql = db
        .prepare("SELECT sql FROM sqlite_master WHERE name = ?")
        .pluck()
        .get(table) as string;
      expect(sql, table).toMatch(/WITHOUT ROWID/i);
    }
  });
});
