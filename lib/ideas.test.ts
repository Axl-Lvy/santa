import { seedParticipants, testDb } from "@/test-utils/db";

import { ValidationError } from "./errors";
import { addIdea, deleteIdea, listIdeasByAuthor, listIdeasForTarget, updateIdea } from "./ideas";

describe("ideas", () => {
  it("adds and lists by author and by target", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie"]);
    const idea = addIdea(db, a.id, b.id, " Elle parle de poterie ");
    expect(idea).toMatchObject({ authorId: a.id, targetId: b.id, body: "Elle parle de poterie" });
    expect(listIdeasByAuthor(db, a.id)).toHaveLength(1);
    expect(listIdeasForTarget(db, b.id)[0].body).toBe("Elle parle de poterie");
  });

  it("stores the body sealed (privacy rule 2)", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie"]);
    addIdea(db, a.id, b.id, "poterie secrète");
    const raw = db.prepare("SELECT body_enc FROM idea").pluck().get() as string;
    expect(raw.startsWith("v1:")).toBe(true);
    expect(raw).not.toContain("poterie");
  });

  it("refuses an idea for oneself, a too long body, and edits by someone else", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie"]);
    expect(() => addIdea(db, a.id, a.id, "moi")).toThrow(ValidationError);
    expect(() => addIdea(db, a.id, b.id, "x".repeat(501))).toThrow(ValidationError);
    const idea = addIdea(db, a.id, b.id, "ok");
    expect(() => updateIdea(db, b.id, idea.id, "volé")).toThrow(ValidationError);
    expect(() => deleteIdea(db, b.id, idea.id)).toThrow(ValidationError);
    expect(updateIdea(db, a.id, idea.id, "mieux").body).toBe("mieux");
    deleteIdea(db, a.id, idea.id);
    expect(listIdeasByAuthor(db, a.id)).toEqual([]);
  });
});
