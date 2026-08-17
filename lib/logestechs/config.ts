import "server-only";

export type LogesTechsConfig = {
  baseUrl: string;
  companyId: string;
  email: string;
  password: string;
};

const PRODUCTION_HOST = "apisv2.logestechs.com";

export class LogesTechsConfigurationError extends Error {
  constructor(public readonly variable: keyof NodeJS.ProcessEnv) {
    super(`Missing or invalid LogesTechs environment variable: ${variable}`);
    this.name = "LogesTechsConfigurationError";
  }
}

function required(variable: keyof NodeJS.ProcessEnv, trim = true): string {
  const rawValue = process.env[variable];
  const value = trim ? rawValue?.trim() : rawValue;
  if (!value) throw new LogesTechsConfigurationError(variable);
  return value;
}

function parseBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    const developmentHosts =
      process.env.NODE_ENV === "production"
        ? []
        : (process.env.LOGESTECHS_ALLOWED_HOSTS ?? "")
            .split(",")
            .map((host) => host.trim().toLowerCase())
            .filter(Boolean);
    const allowedHosts = new Set([PRODUCTION_HOST, ...developmentHosts]);
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

    if (
      url.protocol !== "https:" ||
      !allowedHosts.has(url.hostname.toLowerCase()) ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      url.search ||
      url.hash ||
      normalizedPath !== "/api"
    ) {
      throw new LogesTechsConfigurationError("LOGESTECHS_BASE_URL");
    }

    url.pathname = normalizedPath;
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    if (error instanceof LogesTechsConfigurationError) throw error;
    throw new LogesTechsConfigurationError("LOGESTECHS_BASE_URL");
  }
}

export function getLogesTechsConfig(): LogesTechsConfig {
  const companyId = required("LOGESTECHS_COMPANY_ID");
  const email = required("LOGESTECHS_EMAIL");

  if (!/^\d+$/.test(companyId)) {
    throw new LogesTechsConfigurationError("LOGESTECHS_COMPANY_ID");
  }
  if (!email.includes("@")) {
    throw new LogesTechsConfigurationError("LOGESTECHS_EMAIL");
  }

  return {
    baseUrl: parseBaseUrl(required("LOGESTECHS_BASE_URL")),
    companyId,
    email,
    password: required("LOGESTECHS_PASSWORD", false),
  };
}
