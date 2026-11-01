export type Config = {
  databasePath: string;
  dataKeyHex: string;
  adminName: string;
  adminPin: string;
  appUrl: string;
  production: boolean;
  /** Test site (dev-santa): the admin may act as anyone. */
  impersonation: boolean;
};

export class ConfigError extends Error {}

/** Parses and validates the environment, listing every problem at once. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const problems: string[] = [];
  const read = (name: string) => env[name]?.trim() || null;
  const need = (name: string) => {
    const value = read(name);
    if (!value) problems.push(`${name} is required`);
    return value ?? "";
  };

  const databasePath = need("DATABASE_PATH");
  const dataKeyHex = need("SANTA_DATA_KEY");
  if (dataKeyHex && !/^[0-9a-fA-F]{64}$/.test(dataKeyHex)) {
    problems.push("SANTA_DATA_KEY must be 32 bytes as 64 hex characters");
  }
  const adminName = need("ADMIN_NAME");
  const adminPin = need("ADMIN_PIN");
  if (adminPin && !/^\d{4}$/.test(adminPin)) problems.push("ADMIN_PIN must be exactly 4 digits");
  const appUrl = need("APP_URL").replace(/\/+$/, "");

  if (problems.length > 0) throw new ConfigError(problems.join("; "));
  return {
    databasePath,
    dataKeyHex,
    adminName,
    adminPin,
    appUrl,
    production: env.NODE_ENV === "production",
    impersonation: read("SANTA_IMPERSONATION") === "on",
  };
}

let cached: Config | null = null;

/** The validated configuration of this process. */
export function getConfig(): Config {
  cached ??= loadConfig(process.env);
  return cached;
}
