export type ReplyIntent = "CONFIRMED" | "RESCHEDULE_REQUESTED" | "DECLINED" | "OPTED_OUT" | "MANUAL_REVIEW";

const compact = (value: string) => value.toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "").replace(/\s+/g, " ").trim();

export function classifyReply(value: string): ReplyIntent {
  const text = compact(value);
  if (/^(وقف|الغاء الاشتراك|لا ترسل|stop|unsubscribe)$/.test(text)) return "OPTED_OUT";
  if (/^(نعم|موافق|اكد|تاكيد|تم|yes|confirm|confirmed|ok)$/.test(text)) return "CONFIRMED";
  if (/^(لا اريد|ارفض|رفض|الغاء الطلب|cancel|decline|declined)$/.test(text)) return "DECLINED";
  if (/(موعد|وقت|غدا|بكره|بعد|مساء|صباح|reschedule|tomorrow|later|time)/.test(text)) return "RESCHEDULE_REQUESTED";
  return "MANUAL_REVIEW";
}
