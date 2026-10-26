import { NextRequest } from "next/server";

const viewer = vi.hoisted(() => ({ canImpersonate: true }));
vi.mock("@/lib/viewer", () => ({ DEV_AS_COOKIE: "dev_as", getViewer: async () => viewer }));

const { GET } = await import("./route");

const call = (query: string) => GET(new NextRequest(`http://localhost:3000/api/dev/as?${query}`));

describe("GET /api/dev/as", () => {
  beforeEach(() => {
    viewer.canImpersonate = true;
  });

  it("switches identity and returns to the page the switcher was used on", async () => {
    const res = await call("email=Mamie@Test.fr&next=/envies");
    expect(res.headers.get("location")).toBe("http://localhost:3000/envies");
    expect(res.headers.get("set-cookie")).toContain("dev_as=mamie%40test.fr");
  });

  it("only returns to paths on this site", async () => {
    for (const next of ["//evil.example", "https://evil.example", "javascript:alert(1)"]) {
      const res = await call(`email=a@b.fr&next=${encodeURIComponent(next)}`);
      expect(res.headers.get("location")).toBe("http://localhost:3000/");
    }
  });

  it("does not exist for someone who may not switch accounts", async () => {
    viewer.canImpersonate = false;
    const res = await call("email=a@b.fr");
    expect(res.status).toBe(404);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
