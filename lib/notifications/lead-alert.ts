// تنبيه العميل المحتمل — يُرسل فور حفظ طلب عرض السعر.
// المبدأ: لا ادعاء نجاح. حين لا يكون المزوّد مهيّأً تُعاد الحالة SKIPPED مع تحذير
// في السجل، ولا تُسجَّل "SENT" أبداً — لأن الادعاء الكاذب هنا يعني أن الطلب يضيع بصمت.

import { CONTACT_DOMAIN, CONTACT_EMAILS } from "@/lib/contact";
import {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  choiceLabel,
  type LeadInput,
} from "@/lib/lead-schema";

// مشتق من المخطط: حقل تأهيل جديد يظهر في البريد دون تعديل هنا.
export type LeadAlertInput = LeadInput;

export type LeadAlertResult =
  | { status: "SENT"; provider: string; to: string }
  | { status: "SKIPPED"; reason: "NOT_CONFIGURED" }
  | { status: "FAILED"; provider: string; to: string; reason: string };

/** وجهة التنبيه: متغيّر البيئة أولاً، وإلا بريد المبيعات الرسمي في lib/site.ts. */
export function leadAlertRecipient(): string {
  return process.env.LEAD_ALERT_EMAIL?.trim() || CONTACT_EMAILS.sales;
}

export function leadAlertConfigured(): boolean {
  return (
    process.env.LEAD_ALERT_PROVIDER?.trim().toLowerCase() === "resend" &&
    Boolean(process.env.RESEND_API_KEY?.trim())
  );
}

/** حقول التأهيل تدخل البريد لأن قيمتها في أول مكالمة، لا في لوحة تُفتح لاحقاً. */
function qualificationLines(lead: LeadAlertInput): string[] {
  const rows: [string, string][] = [
    ["حجم الطلبات", choiceLabel(DAILY_VOLUME_OPTIONS, lead.dailyVolume)],
    ["المنصة", choiceLabel(PLATFORM_OPTIONS, lead.platform)],
    ["نطاق التغطية", choiceLabel(COVERAGE_AREA_OPTIONS, lead.coverageArea)],
  ];
  // الحقل غير المُجاب عنه يُعلَن «لم يُحدَّد» لا يُحذف: الصمت في بريد مبيعات
  // يُقرأ خطأً على أنه إغفال من النظام بدل اختيار من العميل.
  return ["التأهيل:", ...rows.map(([label, value]) => `${label}: ${value || "لم يُحدَّد"}`)];
}

function body(lead: LeadAlertInput): string {
  return [
    `طلب عرض سعر جديد من ${CONTACT_DOMAIN}`,
    "",
    `الاسم: ${lead.name}`,
    `المنشأة: ${lead.company}`,
    `البريد: ${lead.email}`,
    `الجوال: ${lead.phone}`,
    "",
    ...qualificationLines(lead),
    "",
    "الرسالة:",
    lead.message,
  ].join("\n");
}

/**
 * يُرسل التنبيه ولا يرمي استثناءً أبداً: الطلب محفوظ قبل هذه النقطة،
 * وفشل التنبيه لا يجوز أن يُفشل استجابة الزائر — لكنه يُسجَّل بصدق.
 */
export async function notifyNewLead(
  lead: LeadAlertInput,
  fetchImpl: typeof fetch = fetch,
): Promise<LeadAlertResult> {
  const to = leadAlertRecipient();

  if (!leadAlertConfigured()) {
    console.warn(
      `[lead-alert] NOT CONFIGURED — لم يُرسل تنبيه لطلب ${lead.company}. اضبط LEAD_ALERT_PROVIDER و RESEND_API_KEY.`,
    );
    return { status: "SKIPPED", reason: "NOT_CONFIGURED" };
  }

  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_ALERT_FROM?.trim() || `QBL <${CONTACT_EMAILS.info}>`,
        to: [to],
        reply_to: lead.email,
        subject: `طلب عرض سعر — ${lead.company}`,
        text: body(lead),
      }),
    });

    if (!response.ok) {
      const reason = `HTTP ${response.status}`;
      console.error(`[lead-alert] FAILED (${reason}) — الطلب محفوظ لكن التنبيه لم يصل: ${lead.company}`);
      return { status: "FAILED", provider: "resend", to, reason };
    }

    return { status: "SENT", provider: "resend", to };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error(`[lead-alert] FAILED (${reason}) — الطلب محفوظ لكن التنبيه لم يصل: ${lead.company}`);
    return { status: "FAILED", provider: "resend", to, reason };
  }
}
