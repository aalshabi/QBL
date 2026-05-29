"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().min(10),
});

export async function submitLead(formData: FormData) {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return;
  }

  revalidatePath("/quote");
}
