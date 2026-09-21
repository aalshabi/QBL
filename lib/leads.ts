// حفظ عملاء نموذج "اطلب عرض" — Prisma عند توفر قاعدة البيانات، ومخزن ذاكرة
// للتطوير فقط. في الإنتاج بلا DATABASE_URL يفشل الحفظ بصوت عالٍ بدل أن يبتلع
// الطلب: مصفوفة الذاكرة تتبخر مع كل استدعاء serverless، فـ"النجاح" الصامت
// يعني عميلاً ضائعاً والزائر يقرأ «تم استلام طلبك».

import { getPrisma } from "@/lib/prisma";

export type LeadInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

export type LeadRecord = LeadInput & {
  id: string;
  status: string;
  createdAt: string;
};

export class LeadStorageUnavailableError extends Error {
  constructor() {
    super("DATABASE_URL غير مضبوط في الإنتاج — لا يمكن حفظ طلب عرض السعر");
    this.name = "LeadStorageUnavailableError";
  }
}

const devLeads: LeadRecord[] = [];

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function saveLead(input: LeadInput): Promise<LeadRecord> {
  if (!process.env.DATABASE_URL) {
    if (isProduction()) {
      throw new LeadStorageUnavailableError();
    }
    const record: LeadRecord = {
      ...input,
      id: `lead-dev-${devLeads.length + 1}`,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    devLeads.push(record);
    console.info(`[lead] captured (dev store): ${input.company} — ${input.email}`);
    return record;
  }

  const created = await getPrisma().lead.create({ data: input });
  return {
    ...input,
    id: created.id,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
  };
}

/** قراءة العملاء المحتملين للوحة الإدارة — الأحدث أولاً. */
export async function listLeads(limit = 100): Promise<LeadRecord[]> {
  if (!process.env.DATABASE_URL) {
    if (isProduction()) {
      throw new LeadStorageUnavailableError();
    }
    return [...devLeads].reverse().slice(0, limit);
  }

  const rows = await getPrisma().lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** للتطوير/الاختبار بلا قاعدة بيانات. */
export function devLeadCount(): number {
  return devLeads.length;
}

/** للاختبار فقط. */
export function resetDevLeads(): void {
  devLeads.length = 0;
}
