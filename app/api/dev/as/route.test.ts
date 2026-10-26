import { NextRequest } from "next/server";

const viewer = vi.hoisted(() => ({ canImpersonate: true }));
vi.mock("@/lib/viewer", () => ({ DEV_AS_COOKIE: "dev_as", getViewer: async () => viewer }));

const { GET } = await import("./route");

// Behind the tunnel the server sees its own bind address, never the public hostname.
const call = (query: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://0.0.0.0:3000/api/dev/as?${query}`, { headers }));

describe("GET /api/dev/as", () => {
  beforeEach(() => {
    viewer.canImpersonate = true;
  });

  it("switches identity and returns to the page the switcher was used on", async () => {
    const res = await call("email=Mamie@Test.fr&next=/envies");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/envies");
    expect(res.headers.get("set-cookie")).toContain("dev_as=mamie%40test.fr");
  });

  it("only returns to paths on this site", async () => {
    for (const next of ["//evil.example", "https://evil.example", "javascript:alert(1)"]) {
      const res = await call(`email=a@b.fr&next=${encodeURIComponent(next)}`);
      expect(res.headers.get("location")).toBe("/");
    }
  });

  it("marks the cookie secure when the public request was https", async () => {
    const res = await call("email=a@b.fr", { "x-forwarded-proto": "https" });
    expect(res.headers.get("set-cookie")).toMatch(/Secure/i);
  });

  it("does not exist for someone who may not switch accounts", async () => {
    viewer.canImpersonate = false;
    const res = await call("email=a@b.fr");
    expect(res.status).toBe(404);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
