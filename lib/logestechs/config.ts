import "server-only";

export type LogesTechsConfig = {
  baseUrl: string;
  companyId: string;
  email: string;
  password: string;
};

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
    if (url.protocol !== "https:") {
      throw new LogesTechsConfigurationError("LOGESTECHS_BASE_URL");
    }
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
