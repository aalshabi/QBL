import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canOperate } from "@/lib/operations/access";
import { caseWorklist } from "@/lib/operations/cases";
import { CaseCenter } from "@/components/operations/case-center";
export const dynamic = "force-dynamic";
export default async function CasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canOperate(session.role)) redirect("/");
  let data;
  try {
    data = await caseWorklist(session);
  } catch {
    return (
      <main dir="rtl" className="p-8">
        <h1 className="text-2xl font-bold">تعذر تحميل حالات التشغيل</h1>
        <p>
          البيانات غير متاحة حاليًا. تواصل مع مسؤول الأنظمة؛ لا توجد بيانات
          تجريبية في هذه الصفحة.
        </p>
      </main>
    );
  }
  return (
    <CaseCenter
      {...data}
      policies={data.policies.map((x) => ({
        ...x,
        updatedAt: x.updatedAt.toISOString(),
      }))}
      commitments={data.commitments.map((x) => ({
        ...x,
        windowStart: x.windowStart.toISOString(),
        windowEnd: x.windowEnd.toISOString(),
        createdAt: x.createdAt.toISOString(),
        updatedAt: x.updatedAt.toISOString(),
      }))}
      cases={data.cases.map((x) => ({
        ...x,
        createdAt: x.createdAt.toISOString(),
        ackDueAt: x.ackDueAt.toISOString(),
        resolutionDueAt: x.resolutionDueAt.toISOString(),
        lastActionAt: x.lastActionAt.toISOString(),
        closedAt: x.closedAt?.toISOString() ?? null,
        customerConfirmedAt: x.customerConfirmedAt?.toISOString() ?? null,
      }))}
      jobHealthy={data.jobHealthy}
    />
  );
}
