import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/admin/guard";

export const metadata: Metadata = {
  title: "لوحة التحكم الإدارية | QBL",
  description: "لوحة تحكم قدام بابك QBL — إدارة الطلبات والمناديب والتحصيل والتقارير.",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
