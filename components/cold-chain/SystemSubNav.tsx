"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MonitorCog, Smartphone, Snowflake } from "lucide-react";

const ITEMS = [
  { href: "/cold-chain-system", label: "نظرة عامة", icon: Snowflake, exact: true },
  { href: "/cold-chain-system/client-dashboard", label: "لوحة العميل", icon: LayoutDashboard },
  { href: "/cold-chain-system/operations-dashboard", label: "لوحة العمليات", icon: MonitorCog },
  { href: "/cold-chain-system/driver-app", label: "تطبيق السائق", icon: Smartphone },
];

export default function SystemSubNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-muted bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="نظام التوصيل المبرد" className="-mb-px flex gap-1 overflow-x-auto">
          {ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition-colors",
                  active
                    ? "border-accent text-primary"
                    : "border-transparent text-slatebrand hover:border-muted hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
