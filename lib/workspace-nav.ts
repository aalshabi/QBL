import type { Role } from "@/lib/auth";

/**
 * Employee-workspace navigation, organised into a small number of meaningful
 * groups. Every item points at a page that ALREADY exists — this is a
 * reorganisation of existing tools, not new modules, and no group is empty.
 *
 * `roles` is honest: it mirrors who the server actually lets in. The admin
 * back-office guard (lib/admin/guard.ts) admits ADMIN and OPS_MANAGER equally,
 * so both see the full set today. The per-group roles make a future, server-
 * enforced split a one-line change; they are NOT a substitute for the server
 * guards, which remain the real access control.
 */
export type WorkspaceNavItem = { href: string; label: string; roles?: readonly Role[] };
export type WorkspaceNavGroup = {
  id: "dashboard" | "operations" | "sales" | "finance" | "reports" | "settings";
  label: string;
  roles: readonly Role[];
  items: WorkspaceNavItem[];
};

const ADMIN_AREA: readonly Role[] = ["ADMIN", "OPS_MANAGER"];

export const WORKSPACE_GROUPS: WorkspaceNavGroup[] = [
  {
    id: "dashboard",
    label: "لوحة العمل",
    roles: ADMIN_AREA,
    items: [
      { href: "/admin", label: "الملخص والتنبيهات" },
      { href: "/admin/tasks", label: "المهام الحرجة" },
    ],
  },
  {
    id: "operations",
    label: "الشحنات والتشغيل",
    roles: ADMIN_AREA,
    items: [
      { href: "/admin/orders", label: "إدارة الطلبات" },
      { href: "/admin/fleet", label: "المناديب والأسطول" },
      { href: "/ops", label: "لوحة العمليات الحيّة" },
    ],
  },
  {
    id: "sales",
    label: "العملاء والمبيعات",
    roles: ADMIN_AREA,
    items: [{ href: "/admin/leads", label: "العملاء المحتملون وطلبات العروض" }],
  },
  {
    id: "finance",
    label: "المالية",
    roles: ADMIN_AREA,
    items: [{ href: "/admin/cod", label: "الفوترة والتحصيل (COD)" }],
  },
  {
    id: "reports",
    label: "التقارير",
    roles: ADMIN_AREA,
    items: [{ href: "/admin/reports", label: "التقارير والمؤشرات" }],
  },
  {
    id: "settings",
    label: "الإعدادات",
    roles: ADMIN_AREA,
    items: [
      { href: "/admin/integrations", label: "التكاملات والخدمات" },
      { href: "/admin/whatsapp", label: "استثناءات واتساب" },
      { href: "/admin/account", label: "حسابي وكلمة المرور" },
    ],
  },
];

/** Groups a given role may see — mirrors server access; never shows an empty group. */
export function groupsForRole(role: Role): WorkspaceNavGroup[] {
  return WORKSPACE_GROUPS.filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
