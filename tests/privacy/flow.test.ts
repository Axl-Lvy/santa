import { adminStatus } from "@/lib/admin-checks";
import { loadAssignment, resetAssignmentCache } from "@/lib/assignment";
import { devOutbox } from "@/lib/mail/transport";
import { listParticipants } from "@/lib/participants";
import { testDb } from "@/test-utils/db";
import { runFullFlow } from "@/test-utils/flow";

const PARTICIPANT_REFS = new Set(["author_id", "owner_id", "target_id", "participant_id", "a_id", "b_id"]);

afterEach(() => {
  resetAssignmentCache();
  vi.restoreAllMocks();
});

async function flow() {
  const db = testDb();
  devOutbox().length = 0;
  const logs: string[] = [];
  for (const level of ["log", "info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
  }
  const result = await runFullFlow(db);
  return { db, logs, ...result };
}

function tables(db: ReturnType<typeof testDb>): string[] {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").pluck().all() as string[];
}

describe("privacy audit over a whole event", () => {
  it("keeps every anonymous body and idea out of the database in clear (rules 1–3)", async () => {
    const { db, secrets } = await flow();
    const dump = tables(db)
      .map((t) => JSON.stringify(db.prepare(`SELECT * FROM ${t}`).all()))
      .join("\n");
    for (const s of secrets) expect(dump).not.toContain(s);
  });

  it("has no row linking a giver to their receiver (rule 1)", async () => {
    const { db } = await flow();
    const assignment = loadAssignment(db)!;
    for (const t of tables(db).filter((name) => name !== "pair_rule" && name !== "idea")) {
      for (const row of db.prepare(`SELECT * FROM ${t}`).all() as Record<string, unknown>[]) {
        const refs = new Set(Object.entries(row).filter(([k]) => PARTICIPANT_REFS.has(k)).map(([, v]) => v));
        for (const [giver, receiver] of assignment) {
          expect(refs.has(giver) && refs.has(receiver), `${t} links ${giver} and ${receiver}`).toBe(false);
        }
      }
    }
  });

  it("logs no secret and not the draw (rule 6)", async () => {
    const { db, logs, secrets } = await flow();
    const all = logs.join("\n");
    for (const s of secrets) expect(all).not.toContain(s);
    expect(all).not.toContain(JSON.stringify(Object.fromEntries(loadAssignment(db)!)));
  });

  it("mails nothing for anonymous activity and names only the recipient (rules 8–9)", async () => {
    const { db, mailsDuringAnonymous, digestMails } = await flow();
    expect(mailsDuringAnonymous).toEqual([]);
    const people = listParticipants(db);
    for (const mail of [...devOutbox(), ...digestMails]) {
      const me = people.find((p) => p.email === mail.to)!;
      for (const other of people.filter((p) => p.id !== me.id)) {
        expect(mail.text).not.toContain(other.firstName);
        expect(mail.html).not.toContain(other.firstName);
      }
    }
    expect(devOutbox().filter((m) => m.subject.startsWith("🎲"))).toHaveLength(8);
  });

  it("shows the admin status only (rule 7)", async () => {
    const { db } = await flow();
    const keys = new Set<string>();
    JSON.stringify(adminStatus(db), (k, v) => {
      if (k && Number.isNaN(Number(k))) keys.add(k);
      return v;
    });
    expect([...keys].sort()).toEqual(["drawnAt", "firstName", "id", "rows", "status"]);
  });
});
