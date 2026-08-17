"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  PlugZap,
  Search,
  Truck,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "الملخص", icon: LayoutDashboard },
  { href: "/admin/orders", label: "إدارة الطلبات", icon: Package },
  { href: "/admin/fleet", label: "المناديب والأسطول", icon: Truck },
  { href: "/admin/cod", label: "الفوترة والتحصيل", icon: Banknote },
  { href: "/admin/reports", label: "التقارير والتحليلات", icon: BarChart3 },
  { href: "/admin/integrations", label: "التكاملات والخدمات", icon: PlugZap },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* الشريط الجانبي */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0D1B3A] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <BrandLogo />
          <div>
            <p className="text-sm font-bold">قدام بابك QBL</p>
            <p className="text-xs text-white/60">لوحة التحكم الإدارية</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#00A7B6] font-semibold text-[#0D1B3A]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
          نسخة الترحيل — المرحلة 2
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
              <p className="text-sm font-semibold">مدير النظام</p>
              <p className="text-xs text-slate-500">ADMIN</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00A7B6] text-sm font-bold text-white">
              م
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
        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
                  active
                    ? "bg-[#00A7B6]/15 text-[#0D1B3A]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
