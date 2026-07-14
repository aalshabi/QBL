"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveLead } from "@/lib/leads";

const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().min(10),
});

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

  revalidatePath("/quote");
  return { ok: true };
}
