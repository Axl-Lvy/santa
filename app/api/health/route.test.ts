import { GET } from "./route";

describe("GET /api/health", () => {
  it("answers 200 ok without any identity", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
