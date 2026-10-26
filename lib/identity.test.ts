import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWTVerifyGetKey } from "jose";

import { seedParticipants, testDb } from "@/test-utils/db";

import {
  canImpersonate,
  normalizeEmail,
  resolveEmail,
  resolveParticipant,
  verifyAccessJwt,
} from "./identity";

const issuer = "https://team.cloudflareaccess.com";
const audience = "app-aud";
let privateKey: CryptoKey;
let jwks: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  jwks = createLocalJWKSet({ keys: [jwk] });
});

function token(
  claims: Record<string, unknown>,
  opts: { aud?: string; iss?: string; exp?: string; key?: CryptoKey } = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(opts.iss ?? issuer)
    .setAudience(opts.aud ?? audience)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "1h")
    .sign(opts.key ?? privateKey);
}

describe("verifyAccessJwt", () => {
  const verify = (t: string) => verifyAccessJwt(t, { jwks, issuer, audience });

  it("returns the normalised email of a valid token", async () => {
    expect(await verify(await token({ email: " Mamie@Test.FR" }))).toBe("mamie@test.fr");
  });

  it("rejects another audience", async () => {
    await expect(verify(await token({ email: "a@b.fr" }, { aud: "other" }))).rejects.toThrow();
  });

  it("rejects another issuer", async () => {
    await expect(
      verify(await token({ email: "a@b.fr" }, { iss: "https://evil.example" })),
    ).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    await expect(verify(await token({ email: "a@b.fr" }, { exp: "-1m" }))).rejects.toThrow();
  });

  it("rejects a token signed by another key", async () => {
    const other = await generateKeyPair("RS256");
    await expect(
      verify(await token({ email: "a@b.fr" }, { key: other.privateKey })),
    ).rejects.toThrow();
  });

  it("rejects a token without an email", async () => {
    await expect(verify(await token({}))).rejects.toThrow();
  });
});

describe("resolveParticipant", () => {
  it("matches regardless of case and surrounding spaces", () => {
    const db = testDb();
    seedParticipants(db, ["Mamie"]);
    expect(resolveParticipant(db, normalizeEmail("MAMIE@test.fr "))?.firstName).toBe("Mamie");
  });

  it("returns null for an unknown email", () => {
    const db = testDb();
    seedParticipants(db, ["Mamie"]);
    expect(resolveParticipant(db, "inconnu@test.fr")).toBeNull();
  });
});

describe("impersonation", () => {
  const base = {
    production: true,
    devIdentityEmail: null,
    impersonation: true,
    adminEmail: "axel@x.fr",
  };

  it("lets the admin act as someone else on an impersonation site", () => {
    expect(canImpersonate("axel@x.fr", base)).toBe(true);
    expect(resolveEmail("axel@x.fr", " Mamie@X.fr ", base)).toBe("mamie@x.fr");
  });

  it("ignores the cookie for anyone else, and everywhere impersonation is off", () => {
    expect(resolveEmail("leon@x.fr", "mamie@x.fr", base)).toBe("leon@x.fr");
    expect(resolveEmail("axel@x.fr", "mamie@x.fr", { ...base, impersonation: false })).toBe(
      "axel@x.fr",
    );
  });

  it("lets anyone switch in local development", () => {
    const dev = {
      production: false,
      devIdentityEmail: "axel@x.fr",
      impersonation: false,
      adminEmail: "axel@x.fr",
    };
    expect(resolveEmail("axel@x.fr", "leon@x.fr", dev)).toBe("leon@x.fr");
  });
});
