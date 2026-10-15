import "server-only";

export type WhatsAppConfig = {
  provider: "meta" | "360dialog";
  enabled: boolean;
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  dialogApiKey: string;
  dialogWebhookSecret: string;
  dailyInitialLimit: number;
  dailyCostLimitUsd: number;
  earlyWarningMinutes: number;
  noResponseMinutes: number;
  deliveryUnknownMinutes: number;
};

function positiveNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    provider: process.env.WHATSAPP_PROVIDER === "meta" ? "meta" : "360dialog",
    enabled: process.env.WHATSAPP_SEND_ENABLED === "true",
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION?.trim() || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "",
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim() || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "",
    dialogApiKey: process.env.WHATSAPP_360DIALOG_API_KEY?.trim() || "",
    dialogWebhookSecret: process.env.WHATSAPP_360DIALOG_WEBHOOK_SECRET?.trim() || "",
    dailyInitialLimit: Math.floor(positiveNumber("WHATSAPP_DAILY_INITIAL_LIMIT", 25)),
    dailyCostLimitUsd: positiveNumber("WHATSAPP_DAILY_COST_LIMIT_USD", 1),
    earlyWarningMinutes: Math.floor(positiveNumber("WHATSAPP_EARLY_WARNING_MINUTES", 15)),
    noResponseMinutes: Math.floor(positiveNumber("WHATSAPP_NO_RESPONSE_MINUTES", 30)),
    deliveryUnknownMinutes: Math.floor(positiveNumber("WHATSAPP_DELIVERY_UNKNOWN_MINUTES", 15)),
  };
}

export function assertWebhookConfigured(config = getWhatsAppConfig()) {
  const valid = config.provider === "360dialog"
    ? config.dialogWebhookSecret.length >= 32
    : config.appSecret.length >= 32 && config.verifyToken.length >= 32;
  if (!valid) {
    throw new Error("WHATSAPP_WEBHOOK_NOT_CONFIGURED");
  }
  return config;
}

export function assertSendingConfigured(config = getWhatsAppConfig()) {
  if (!config.enabled) throw new Error("WHATSAPP_SEND_DISABLED");
  if (config.provider === "360dialog") {
    if (config.dialogApiKey.length < 32) throw new Error("WHATSAPP_SEND_NOT_CONFIGURED");
  } else if (!/^v\d+\.\d+$/.test(config.graphVersion) || !config.phoneNumberId || !config.accessToken) {
    throw new Error("WHATSAPP_SEND_NOT_CONFIGURED");
  }
  return config;
}
