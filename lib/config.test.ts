import { ConfigError, loadConfig } from "./config";

const key = "ab".repeat(32);

const production = {
  NODE_ENV: "production",
  DATABASE_PATH: "/data/santa.db",
  SANTA_DATA_KEY: key,
  ADMIN_NAME: "Axel",
  ADMIN_PIN: "1234",
  APP_URL: "https://santa.axl-lvy.fr",
} as NodeJS.ProcessEnv;

describe("loadConfig", () => {
  it("accepts a complete production env without Cloudflare Access or email", () => {
    const c = loadConfig(production);
    expect(c).toMatchObject({ production: true, adminName: "Axel", adminPin: "1234" });
    expect(c).not.toHaveProperty("smtp");
    expect(c).not.toHaveProperty("cfAud");
    expect(c).not.toHaveProperty("adminEmail");
  });

  it("names every missing variable", () => {
    const env = { ...production, SANTA_DATA_KEY: undefined, ADMIN_NAME: undefined };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(
      /SANTA_DATA_KEY[\s\S]*ADMIN_NAME|ADMIN_NAME[\s\S]*SANTA_DATA_KEY/,
    );
  });

  it("requires the admin PIN to be exactly 4 digits", () => {
    expect(() => loadConfig({ ...production, ADMIN_PIN: undefined })).toThrow(/ADMIN_PIN/);
    for (const pin of ["123", "12a4", "12345"]) {
      expect(() => loadConfig({ ...production, ADMIN_PIN: pin })).toThrow(
        "ADMIN_PIN must be exactly 4 digits",
      );
    }
  });

  it("rejects a data key that is not 64 hex chars", () => {
    expect(() => loadConfig({ ...production, SANTA_DATA_KEY: "abc" })).toThrow(/SANTA_DATA_KEY/);
  });

  it("trims the admin name", () => {
    expect(loadConfig({ ...production, ADMIN_NAME: " Axel " }).adminName).toBe("Axel");
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
