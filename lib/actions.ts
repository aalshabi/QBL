"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveLead } from "@/lib/leads";

// الحقول المخزّنة إلزامياً في قاعدة البيانات؛ باقي حقول نموذج التجربة تُجمّع في message.
const baseSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
});

export type LeadResult = { ok: boolean; error?: string };

const MESSAGE_FIELDS: { key: string; label: string }[] = [
  { key: "activityType", label: "نوع النشاط" },
  { key: "website", label: "الموقع الإلكتروني" },
  { key: "productTypes", label: "أنواع المنتجات" },
  { key: "storageInstructions", label: "تعليمات الحفظ" },
  { key: "needsRefrigeration", label: "منتجات تتطلب تبريداً فعلياً" },
  { key: "avgOrders", label: "متوسط عدد الطلبات" },
  { key: "pickupPoints", label: "نقاط الاستلام" },
  { key: "deliveryAreas", label: "مناطق التسليم" },
  { key: "deliveryTime", label: "مدة التوصيل المطلوبة" },
  { key: "docLevel", label: "مستوى التوثيق المطلوب" },
  { key: "hasReturns", label: "شحن عكسي للمرتجعات" },
  { key: "startDate", label: "الموعد المفضل لبدء التجربة" },
  { key: "message", label: "ملاحظات" },
];

export async function submitLead(formData: FormData): Promise<LeadResult> {
  const base = baseSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!base.success) {
    return { ok: false, error: "يرجى تعبئة الحقول الإلزامية بشكل صحيح." };
  }

  const details = MESSAGE_FIELDS.map(({ key, label }) => {
    const value = formData.get(key);
    return value && String(value).trim() ? `${label}: ${String(value).trim()}` : null;
  }).filter(Boolean).join("\n");

  try {
    await saveLead({
      ...base.data,
      message: details || "طلب تجربة Beauty Shield",
    });
  } catch (error) {
    console.error("[lead] failed to persist", error);
    return { ok: false, error: "تعذر حفظ الطلب، حاول مرة أخرى." };
  }

  revalidatePath("/trial");
  return { ok: true };
}
