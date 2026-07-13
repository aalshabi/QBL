import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "لوحة التحكم الإدارية | QBL",
  description: "لوحة تحكم قدام بابك QBL — إدارة الطلبات والمناديب والتحصيل والتقارير.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
