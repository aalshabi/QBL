"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import type { Role } from "@/lib/auth";
import { roleLabel } from "@/lib/workspace";
import { groupsForRole, type WorkspaceNavGroup } from "@/lib/workspace-nav";
import { cn } from "@/lib/utils";

/**
 * Each of the six workspace groups carries one icon. The icon lives here (a
 * client component) rather than in lib/workspace-nav.ts so that module stays a
 * plain, test-friendly data/role source with no React/lucide dependency.
 */
const GROUP_ICON: Record<WorkspaceNavGroup["id"], ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  operations: Truck,
  sales: Users,
  finance: Banknote,
  reports: BarChart3,
  settings: Settings,
};

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = groupsForRole(role);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* الشريط الجانبي — المجموعات الست */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0D1B3A] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <BrandLogo inverse size="sm" />
          <div>
            <p className="text-sm font-bold">قدام بابك QBL</p>
            <p className="text-xs text-white/60">مساحة عمل الفريق</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => {
            const Icon = GROUP_ICON[group.id];
            return (
              <div key={group.id} className="space-y-1">
                <p className="flex items-center gap-2 px-3 text-[0.7rem] font-semibold tracking-wide text-white/45 uppercase">
                  <Icon className="h-3.5 w-3.5" />
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[#00A7B6] font-semibold text-[#0D1B3A]"
                          : "text-white/80 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
          مساحة عمل موحّدة — ست مجموعات
        </div>
      </aside>

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="ps-9"
              placeholder="أدخل رقم الطلب أو المرجع أو اسم العميل للمتابعة"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-end sm:block">
              <p className="text-sm font-semibold">{roleLabel(role)}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00A7B6] text-sm font-bold text-white">
              {roleLabel(role).charAt(0)}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {/* التنقل على الجوال — المجموعات نفسها، مع عنوان كل مجموعة فاصلاً */}
        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 lg:hidden">
          {groups.map((group) => (
            <div key={group.id} className="flex shrink-0 items-center gap-2">
              <span className="shrink-0 text-[0.7rem] font-semibold whitespace-nowrap text-slate-400">
                {group.label}
              </span>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap",
                      active
                        ? "bg-[#00A7B6]/15 text-[#0D1B3A]"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
