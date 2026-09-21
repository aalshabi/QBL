import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

// صفحة التتبع مكوّن عميل فلا تستطيع تصدير metadata بنفسها — الـ layout يحملها عنها.
export const metadata: Metadata = pageMetadata({
  title: "تتبع شحنة QBL داخل الرياض برقم الشحنة والجوال",
  description:
    "تابع حالة شحنتك من QBL داخل الرياض: أدخل رقم الشحنة وآخر 4 أرقام من الجوال المسجل على الطلب لعرض حالة التوصيل وآخر تحديث على مسار الشحنة.",
  path: "/track",
});

export default function TrackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
