import "server-only";

export type WhatsAppConfig = {
  enabled: boolean;
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  dailyInitialLimit: number;
  dailyCostLimitUsd: number;
};

function positiveNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    enabled: process.env.WHATSAPP_SEND_ENABLED === "true",
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION?.trim() || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "",
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim() || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "",
    dailyInitialLimit: Math.floor(positiveNumber("WHATSAPP_DAILY_INITIAL_LIMIT", 25)),
    dailyCostLimitUsd: positiveNumber("WHATSAPP_DAILY_COST_LIMIT_USD", 1),
  };
}

export function assertWebhookConfigured(config = getWhatsAppConfig()) {
  if (config.appSecret.length < 32 || config.verifyToken.length < 32) {
    throw new Error("WHATSAPP_WEBHOOK_NOT_CONFIGURED");
  }
  return config;
}

export function assertSendingConfigured(config = getWhatsAppConfig()) {
  if (!config.enabled) throw new Error("WHATSAPP_SEND_DISABLED");
  if (!/^v\d+\.\d+$/.test(config.graphVersion) || !config.phoneNumberId || !config.accessToken) throw new Error("WHATSAPP_SEND_NOT_CONFIGURED");
  return config;
}
