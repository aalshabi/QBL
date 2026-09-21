"use server";

import { revalidatePath } from "next/cache";
import { leadSchema } from "@/lib/lead-schema";
import { saveLead } from "@/lib/leads";
import { notifyNewLead } from "@/lib/notifications/lead-alert";

export type LeadResult = { ok: boolean; error?: string };

export async function submitLead(formData: FormData): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: "يرجى تعبئة كل الحقول بشكل صحيح." };
  }

  try {
    await saveLead(parsed.data);
  } catch (error) {
    console.error("[lead] failed to persist", error);
    return { ok: false, error: "تعذر حفظ الطلب، حاول مرة أخرى." };
  }

  // الطلب محفوظ. فشل التنبيه يُسجَّل ولا يُفشل استجابة الزائر.
  await notifyNewLead(parsed.data);

  revalidatePath("/quote");
  return { ok: true };
}
