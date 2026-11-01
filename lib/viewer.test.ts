import { seedParticipants, testDb } from "@/test-utils/db";

import { createSession } from "./session";

const state = vi.hoisted(() => ({
  db: null as unknown,
  cookies: {} as Record<string, string>,
  config: { adminName: "Axel", production: true, impersonation: false },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookies[name] === undefined ? undefined : { value: state.cookies[name] },
  }),
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
vi.mock("./config", () => ({ getConfig: () => state.config }));

const { getViewer, requirePageParticipant } = await import("./viewer");

function setup(names: string[]) {
  const db = testDb();
  state.db = db;
  state.cookies = {};
  state.config = { adminName: "Axel", production: true, impersonation: false };
  return { db, people: seedParticipants(db, names) };
}

const loginAs = (db: ReturnType<typeof testDb>, participantId: number | null, isAdmin = false) => {
  state.cookies.santa_session = createSession(db, { participantId, isAdmin });
};

describe("getViewer", () => {
  it("is nobody without a valid session", async () => {
    setup(["Léon"]);
    expect(await getViewer()).toBeNull();
    state.cookies.santa_session = "forged";
    expect(await getViewer()).toBeNull();
  });

  it("is the guest of a guest session", async () => {
    const { db, people } = setup(["Léon"]);
    loginAs(db, people[0].id);
    expect(await getViewer()).toMatchObject({
      participant: { firstName: "Léon" },
      isAdmin: false,
      canImpersonate: false,
    });
  });

  it("is the guest named like the admin for an admin session, or nobody yet", async () => {
    const { db } = setup(["Léon"]);
    loginAs(db, null, true);
    expect(await getViewer()).toMatchObject({ participant: null, isAdmin: true });
    seedParticipants(db, ["Axel"]);
    expect(await getViewer()).toMatchObject({ participant: { firstName: "Axel" }, isAdmin: true });
  });

  it("lets only the admin switch, and only off production or on a test site", async () => {
    const { db, people } = setup(["Axel", "Léon"]);
    state.cookies.dev_as = String(people[1].id);
    loginAs(db, people[1].id);
    expect(await getViewer()).toMatchObject({ canImpersonate: false });

    loginAs(db, null, true);
    expect(await getViewer()).toMatchObject({
      participant: { firstName: "Axel" },
      canImpersonate: false,
    });

    state.config.impersonation = true;
    expect(await getViewer()).toMatchObject({
      participant: { firstName: "Léon" },
      isAdmin: false,
      canImpersonate: true,
    });

    state.config = { adminName: "Axel", production: false, impersonation: false };
    expect(await getViewer()).toMatchObject({ participant: { firstName: "Léon" } });
  });
});

describe("requirePageParticipant", () => {
  it("sends an unrevealed participant to the scratch card once the draw exists, on any page", async () => {
    const { db, people } = setup(["Léon", "Mamie", "Papa"]);
    loginAs(db, people[0].id);
    await expect(requirePageParticipant()).resolves.toMatchObject({ me: { firstName: "Léon" } });
    db.prepare("UPDATE event SET drawn_at = '2026-12-01T10:00:00Z'").run();
    await expect(requirePageParticipant()).rejects.toThrow("REDIRECT /decouvrir");
    db.prepare("UPDATE participant SET revealed_at = 'x'").run();
    await expect(requirePageParticipant()).resolves.toMatchObject({ me: { firstName: "Léon" } });
  });
});
