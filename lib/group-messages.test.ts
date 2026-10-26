import { seedParticipants, testDb } from "@/test-utils/db";

import { ValidationError } from "./errors";
import { listGroupMessages, postGroupMessage } from "./group-messages";
import { getParticipant } from "./participants";

describe("group messages", () => {
  it("posts and lists in order, keeping emoji and line breaks", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie"]);
    postGroupMessage(db, getParticipant(db, a.id)!, "  Coucou 🎄\nça va ?  ");
    postGroupMessage(db, getParticipant(db, b.id)!, "Oui !");
    expect(listGroupMessages(db).map((m) => [m.authorName, m.body])).toEqual([
      ["Léon", "Coucou 🎄\nça va ?"],
      ["Mamie", "Oui !"],
    ]);
  });

  it("refuses empty and too long messages", () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["Léon"]);
    const me = getParticipant(db, a.id)!;
    expect(() => postGroupMessage(db, me, "   ")).toThrow(ValidationError);
    expect(() => postGroupMessage(db, me, "x".repeat(2001))).toThrow(
      "Ton message est trop long (2000 caractères maximum).",
    );
    expect(() => postGroupMessage(db, me, "x".repeat(2000))).not.toThrow();
  });
});
