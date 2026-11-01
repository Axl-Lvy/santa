import { seedParticipants, testDb } from "@/test-utils/db";

const state = vi.hoisted(() => ({
  db: null as unknown,
  appUrl: "https://santa.axl-lvy.fr",
  set: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "UA" }),
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) =>
      state.set.push({ name, value, options }),
  }),
}));
vi.mock("../db", async (orig) => ({
  ...(await orig<typeof import("../db")>()),
  getDb: () => state.db,
}));
vi.mock("../config", () => ({
  getConfig: () => ({ adminName: "Axel", adminPin: "1234", appUrl: state.appUrl }),
}));

const { loginAction } = await import("./session");

describe("loginAction", () => {
  beforeEach(() => {
    const db = testDb();
    seedParticipants(db, ["Léon"]);
    state.db = db;
    state.set = [];
  });

  it("sets a Secure session cookie on an https site, even without forwarded headers", async () => {
    state.appUrl = "https://santa.axl-lvy.fr";
    await expect(loginAction("leon", "")).resolves.toEqual({ ok: true, value: "in" });
    expect(state.set).toHaveLength(1);
    expect(state.set[0]).toMatchObject({
      name: "santa_session",
      options: { httpOnly: true, sameSite: "lax", secure: true, path: "/" },
    });
  });

  it("leaves the cookie usable over plain http in local dev", async () => {
    state.appUrl = "http://localhost:3000";
    await loginAction("leon", "");
    expect(state.set[0].options.secure).toBe(false);
  });
});
