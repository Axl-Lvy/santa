import { ConfigError, loadConfig } from "./config";

const key = "ab".repeat(32);

const production = {
  NODE_ENV: "production",
  DATABASE_PATH: "/data/santa.db",
  SANTA_DATA_KEY: key,
  ADMIN_EMAIL: "axel@x.fr",
  CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
  CF_ACCESS_AUD: "aud",
  APP_URL: "https://santa.axl-lvy.fr",
} as NodeJS.ProcessEnv;

describe("loadConfig", () => {
  it("accepts a complete production env", () => {
    const c = loadConfig(production);
    expect(c.production).toBe(true);
  });

  it("ignores SMTP variables", () => {
    const c = loadConfig({ ...production, SMTP_HOST: "x" });
    expect(c).not.toHaveProperty("smtp");
    expect(c).not.toHaveProperty("mailFrom");
  });

  it("names every missing production variable", () => {
    const env = { ...production, SANTA_DATA_KEY: undefined, CF_ACCESS_AUD: undefined };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(
      /SANTA_DATA_KEY[\s\S]*CF_ACCESS_AUD|CF_ACCESS_AUD[\s\S]*SANTA_DATA_KEY/,
    );
  });

  it("rejects a data key that is not 64 hex chars", () => {
    expect(() => loadConfig({ ...production, SANTA_DATA_KEY: "abc" })).toThrow(/SANTA_DATA_KEY/);
  });

  it("refuses the dev identity bypass in production", () => {
    expect(() => loadConfig({ ...production, DEV_IDENTITY_EMAIL: "a@b.fr" })).toThrow(
      /DEV_IDENTITY_EMAIL/,
    );
  });

  it("allows dev without cloudflare when a dev identity is set", () => {
    const c = loadConfig({
      NODE_ENV: "development",
      DATABASE_PATH: "./data/dev.db",
      SANTA_DATA_KEY: key,
      ADMIN_EMAIL: "axel@x.fr",
      APP_URL: "http://localhost:3000",
      DEV_IDENTITY_EMAIL: "Axel@X.fr",
    } as NodeJS.ProcessEnv);
    expect(c.cfAud).toBeNull();
    expect(c.devIdentityEmail).toBe("axel@x.fr");
  });

  it("normalises the admin email", () => {
    expect(loadConfig({ ...production, ADMIN_EMAIL: " Axel@X.fr " }).adminEmail).toBe("axel@x.fr");
  });
});

describe("impersonation mode (dev-santa)", () => {
  it("is on when asked for", () => {
    expect(loadConfig({ ...production, SANTA_IMPERSONATION: "on" }).impersonation).toBe(true);
  });

  it("is off unless asked for", () => {
    expect(loadConfig(production).impersonation).toBe(false);
  });
});
