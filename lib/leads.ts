// حفظ عملاء نموذج "اطلب عرض" — Prisma عند توفر قاعدة البيانات، وإلا مخزن ذاكرة
// للتطوير (نفس نمط التبديل في lib/admin/data.ts). لا إسقاط صامت للبيانات.

import { getPrisma } from "@/lib/prisma";

export type LeadInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

const devLeads: (LeadInput & { id: string; createdAt: string })[] = [];

export async function saveLead(input: LeadInput): Promise<void> {
  if (!process.env.DATABASE_URL) {
    devLeads.push({ ...input, id: `lead-dev-${devLeads.length + 1}`, createdAt: new Date().toISOString() });
    console.info(`[lead] captured (dev store): ${input.company} — ${input.email}`);
    return;
  }
  await getPrisma().lead.create({ data: input });
}

/** للتطوير/الاختبار بلا قاعدة بيانات. */
export function devLeadCount(): number {
  return devLeads.length;
}
