import { createBox } from "./crypto";

const box = createBox("11".repeat(32));

describe("createBox", () => {
  it("round-trips a value", () => {
    expect(box.open(box.seal({ a: 1 }))).toEqual({ a: 1 });
  });

  it("produces a different ciphertext each time", () => {
    expect(box.seal("same")).not.toBe(box.seal("same"));
  });

  it("hides the plaintext behind a versioned prefix", () => {
    const sealed = box.seal({ secret: "Léon" });
    expect(sealed.startsWith("v1:")).toBe(true);
    expect(sealed).not.toContain("Léon");
  });

  it("rejects a tampered ciphertext", () => {
    const parts = box.seal("x").split(":");
    const ct = Buffer.from(parts[3], "base64");
    ct[0] ^= 1;
    parts[3] = ct.toString("base64");
    expect(() => box.open(parts.join(":"))).toThrow();
  });

  it("rejects another key", () => {
    expect(() => createBox("22".repeat(32)).open(box.seal("x"))).toThrow();
  });
});
