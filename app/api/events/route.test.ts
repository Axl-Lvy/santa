import { publish } from "@/lib/bus";

const viewer = {
  current: null as null | { email: string; isAdmin: boolean; participant: { id: number } },
};
vi.mock("@/lib/viewer", () => ({ getViewer: async () => viewer.current }));

const { GET } = await import("./route");

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";
  while (!text.includes(needle)) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe("GET /api/events", () => {
  afterEach(() => vi.useRealTimers());

  it("refuses a request without a participant", async () => {
    viewer.current = null;
    const res = await GET(new Request("http://x/api/events"));
    expect(res.status).toBe(401);
  });

  it("streams the viewer's events as kind-only payloads, with heartbeats", async () => {
    vi.useFakeTimers();
    viewer.current = { email: "a@b.fr", isAdmin: false, participant: { id: 42 } };
    const abort = new AbortController();
    const res = await GET(new Request("http://x/api/events", { signal: abort.signal }));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    const reader = res.body!.getReader();
    publish(42, "group");
    publish(7, "santa");
    expect(await readUntil(reader, "data:")).toContain('data: {"kind":"group"}\n\n');
    vi.advanceTimersByTime(25_000);
    expect(await readUntil(reader, ": ping")).toContain(": ping");
    abort.abort();
    publish(42, "group");
    const { done } = await reader.read();
    expect(done).toBe(true);
  });
});

describe("GET /api/events after the client left", () => {
  it("never throws into the code that publishes", async () => {
    viewer.current = { email: "a@b.fr", isAdmin: false, participant: { id: 77 } };
    const res = await GET(new Request("http://x/api/events"));
    await res.body!.cancel();
    expect(() => publish(77, "ideas")).not.toThrow();
  });
});
