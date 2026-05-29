type NotificationPayload = {
  to: string;
  templateKey: "tracking_link" | "otp_code" | "delivery_update";
  variables: Record<string, string | number>;
};

export type NotificationAdapter = {
  sendSms(payload: NotificationPayload): Promise<{ providerRef: string; status: "SENT" | "FAILED" }>;
  sendWhatsApp(payload: NotificationPayload): Promise<{ providerRef: string; status: "SENT" | "FAILED" }>;
};

export const mockNotificationAdapter: NotificationAdapter = {
  async sendSms(payload) {
    return {
      providerRef: `mock-sms-${payload.templateKey}-${Date.now()}`,
      status: "SENT",
    };
  },
  async sendWhatsApp(payload) {
    return {
      providerRef: `mock-wa-${payload.templateKey}-${Date.now()}`,
      status: "SENT",
    };
  },
};

export function getNotificationAdapter() {
  return mockNotificationAdapter;
}
