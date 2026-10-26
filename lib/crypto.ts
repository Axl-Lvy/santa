import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getConfig } from "./config";

export type Box = { seal(value: unknown): string; open<T>(sealed: string): T };

/** AES-256-GCM sealing of JSON values under one key. */
export function createBox(keyHex: string): Box {
  const key = Buffer.from(keyHex, "hex");
  return {
    seal(value) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ct = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
      return ["v1", iv, cipher.getAuthTag(), ct]
        .map((p) => (typeof p === "string" ? p : p.toString("base64")))
        .join(":");
    },
    open<T>(sealed: string): T {
      const [version, iv, tag, ct] = sealed.split(":");
      if (version !== "v1" || !iv || !tag || ct === undefined)
        throw new Error("not a sealed value");
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      const plain = Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]);
      return JSON.parse(plain.toString("utf8")) as T;
    },
  };
}

let cached: Box | null = null;

/** The box keyed by `SANTA_DATA_KEY`. */
export function box(): Box {
  cached ??= createBox(getConfig().dataKeyHex);
  return cached;
}
