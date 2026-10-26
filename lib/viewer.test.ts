import { seedParticipants, testDb } from "@/test-utils/db";

const state = vi.hoisted(() => ({ db: null as unknown, email: "léon@test.fr" }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: state.email }) }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("./db", async (orig) => ({
  ...(await orig<typeof import("./db")>()),
  getDb: () => state.db,
}));

const { requirePageParticipant } = await import("./viewer");

describe("requirePageParticipant", () => {
  it("sends an unrevealed participant to the scratch card once the draw exists, on any page", async () => {
    const db = testDb();
    seedParticipants(db, ["Léon", "Mamie", "Papa"]);
    state.db = db;
    await expect(requirePageParticipant()).resolves.toMatchObject({ me: { firstName: "Léon" } });
    db.prepare("UPDATE event SET drawn_at = '2026-12-01T10:00:00Z'").run();
    await expect(requirePageParticipant()).rejects.toThrow("REDIRECT /decouvrir");
    db.prepare("UPDATE participant SET revealed_at = 'x'").run();
    await expect(requirePageParticipant()).resolves.toMatchObject({ me: { firstName: "Léon" } });
  });
});
