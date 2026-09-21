/**
 * نصوص الإنذارات وأنواعها — بلا `server-only` عمداً.
 *
 * لوحة العمليات مكوّن عميل، واستيرادها ثابتاً من وحدة خادمية يكسر البناء كله.
 * الأنواع والنصوص مشتركة بين الطرفين، والاستعلامات تبقى في lib/ops/live-data.ts.
 */

export type ColdChainAlertKind = "OUT_OF_RANGE" | "STALE_READING" | "NO_TELEMETRY";

export const COLD_CHAIN_ALERT_LABEL: Record<ColdChainAlertKind, string> = {
  OUT_OF_RANGE: "خرق نطاق الحرارة",
  STALE_READING: "القراءات توقفت",
  NO_TELEMETRY: "لا توجد قراءة حرارة",
};

export type OpsColdChainAlert = {
  id: string;
  orderCode: string;
  kind: ColdChainAlertKind;
  severity: string;
  celsius: number | null;
  occurrences: number;
  detectedAt: string;
  note: string | null;
};
