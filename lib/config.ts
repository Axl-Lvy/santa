export type Config = {
  databasePath: string;
  dataKeyHex: string;
  adminEmail: string;
  cfTeamDomain: string | null;
  cfAud: string | null;
  appUrl: string;
  devIdentityEmail: string | null;
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

  const production = env.NODE_ENV === "production";
  const impersonation = read("SANTA_IMPERSONATION") === "on";
  const devIdentity = read("DEV_IDENTITY_EMAIL");
  if (devIdentity && production) problems.push("DEV_IDENTITY_EMAIL must not be set in production");

  const databasePath = need("DATABASE_PATH");
  const dataKeyHex = need("SANTA_DATA_KEY");
  if (dataKeyHex && !/^[0-9a-fA-F]{64}$/.test(dataKeyHex)) {
    problems.push("SANTA_DATA_KEY must be 32 bytes as 64 hex characters");
  }
  const adminEmail = need("ADMIN_EMAIL").toLowerCase();
  const appUrl = need("APP_URL").replace(/\/+$/, "");

  const cfRequired = production || !devIdentity;
  const cfTeamDomain = cfRequired ? need("CF_ACCESS_TEAM_DOMAIN") : read("CF_ACCESS_TEAM_DOMAIN");
  const cfAud = cfRequired ? need("CF_ACCESS_AUD") : read("CF_ACCESS_AUD");

  if (problems.length > 0) throw new ConfigError(problems.join("; "));
  return {
    databasePath,
    dataKeyHex,
    adminEmail,
    cfTeamDomain: cfTeamDomain || null,
    cfAud: cfAud || null,
    appUrl,
    devIdentityEmail: devIdentity?.toLowerCase() ?? null,
    production,
    impersonation,
  };
}

let cached: Config | null = null;

/** The validated configuration of this process. */
export function getConfig(): Config {
  cached ??= loadConfig(process.env);
  return cached;
}
