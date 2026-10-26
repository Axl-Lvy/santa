export type Config = {
  databasePath: string;
  dataKeyHex: string;
  adminEmail: string;
  cfTeamDomain: string | null;
  cfAud: string | null;
  smtp: { host: string; port: number; user: string; password: string } | null;
  mailFrom: string;
  appUrl: string;
  devIdentityEmail: string | null;
  production: boolean;
};

export class ConfigError extends Error {}

const DEFAULT_MAIL_FROM = '"Père Noël secret" <no-reply@axl-lvy.fr>';

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

  let smtp: Config["smtp"] = null;
  if (production || read("SMTP_HOST")) {
    const host = need("SMTP_HOST");
    const port = Number(need("SMTP_PORT"));
    if (!Number.isInteger(port) || port <= 0) problems.push("SMTP_PORT must be a port number");
    smtp = { host, port, user: need("SMTP_USER"), password: need("SMTP_PASSWORD") };
  }
  const mailFrom = production ? need("MAIL_FROM") : (read("MAIL_FROM") ?? DEFAULT_MAIL_FROM);

  if (problems.length > 0) throw new ConfigError(problems.join("; "));
  return {
    databasePath,
    dataKeyHex,
    adminEmail,
    cfTeamDomain: cfTeamDomain || null,
    cfAud: cfAud || null,
    smtp,
    mailFrom,
    appUrl,
    devIdentityEmail: devIdentity?.toLowerCase() ?? null,
    production,
  };
}

let cached: Config | null = null;

/** The validated configuration of this process. */
export function getConfig(): Config {
  cached ??= loadConfig(process.env);
  return cached;
}
