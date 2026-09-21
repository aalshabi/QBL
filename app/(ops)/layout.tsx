import type { ReactNode } from "react";
import { requireOpsPage } from "@/lib/ops/guard";

/**
 * حارس مجموعة (ops) — لوحة العمليات تعرض مواقع المناديب وبيانات الطلبات،
 * فلا تُفتح لزائر مجهول. الفحص مكرر في الصفحة نفسها لأن Next.js قد ينفّذ
 * الصفحة بالتوازي مع الـ layout، فلا يُعتمد على الـ layout وحده لحماية البيانات.
 */
export default async function OpsLayout({ children }: { children: ReactNode }) {
  await requireOpsPage();
  return <>{children}</>;
}
