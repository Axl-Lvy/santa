import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { GET } = await import("./route");

const call = (query: string) => GET(new NextRequest(`http://localhost:3000/api/dev/as?${query}`));

describe("GET /api/dev/as", () => {
  it("switches identity and returns to the page the switcher was used on", () => {
    const res = call("email=Mamie@Test.fr&next=/envies");
    expect(res.headers.get("location")).toBe("http://localhost:3000/envies");
    expect(res.headers.get("set-cookie")).toContain("dev_as=mamie%40test.fr");
  });

  it("only returns to paths on this site", () => {
    for (const next of ["//evil.example", "https://evil.example", "javascript:alert(1)"]) {
      expect(call(`email=a@b.fr&next=${encodeURIComponent(next)}`).headers.get("location")).toBe(
        "http://localhost:3000/",
      );
    }
  });
});
