import { seedParticipants, testDb } from "@/test-utils/db";

import { ValidationError } from "./errors";
import { addWish, deleteWish, listWishes, updateWish } from "./wishes";

describe("wishes", () => {
  it("adds, updates and deletes, appending positions", () => {
    const db = testDb();
    const [p] = seedParticipants(db, ["Léon"]);
    const a = addWish(db, p.id, { title: " Un livre ", detail: "", url: "" });
    const b = addWish(db, p.id, {
      title: "Des gants",
      detail: "Taille M",
      url: "https://exemple.fr/x",
    });
    expect(a).toMatchObject({ title: "Un livre", detail: null, url: null, position: 0 });
    expect(b.position).toBe(1);
    updateWish(db, p.id, a.id, { title: "Un roman", detail: "policier", url: "" });
    expect(listWishes(db, p.id).map((w) => w.title)).toEqual(["Un roman", "Des gants"]);
    deleteWish(db, p.id, b.id);
    expect(listWishes(db, p.id)).toHaveLength(1);
  });

  it("refuses an empty or too long title and a too long detail", () => {
    const db = testDb();
    const [p] = seedParticipants(db, ["Léon"]);
    expect(() => addWish(db, p.id, { title: " ", detail: "", url: "" })).toThrow(ValidationError);
    expect(() => addWish(db, p.id, { title: "x".repeat(201), detail: "", url: "" })).toThrow(
      ValidationError,
    );
    expect(() => addWish(db, p.id, { title: "ok", detail: "x".repeat(501), url: "" })).toThrow(
      ValidationError,
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://x.fr/a", "exemple.fr"])(
    "refuses the link %s",
    (url) => {
      const db = testDb();
      const [p] = seedParticipants(db, ["Léon"]);
      expect(() => addWish(db, p.id, { title: "ok", detail: "", url })).toThrow(
        "Le lien doit commencer par http:// ou https://",
      );
    },
  );

  it("refuses edits by someone else", () => {
    const db = testDb();
    const [p, q] = seedParticipants(db, ["Léon", "Mamie"]);
    const w = addWish(db, p.id, { title: "ok", detail: "", url: "" });
    expect(() => updateWish(db, q.id, w.id, { title: "volé", detail: "", url: "" })).toThrow(
      ValidationError,
    );
    expect(() => deleteWish(db, q.id, w.id)).toThrow(ValidationError);
  });
});
