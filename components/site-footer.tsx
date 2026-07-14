"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { company, marketingNav } from "@/lib/company";

export function SiteFooter() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const links = isEnglish
    ? [
        { href: "/en", label: "Home" },
        { href: "/en/beauty-shield", label: "Beauty Shield" },
        { href: "/en/trial", label: "Trial" },
        { href: "/", label: "العربية" },
      ]
    : [
        ...marketingNav,
        { href: "/trial", label: "تجربة Beauty Shield" },
        { href: "/about", label: "من نحن" },
      ];
  return (
    <footer className="border-t bg-primary text-primary-foreground" dir={isEnglish ? "ltr" : "rtl"}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandLogo className="[&_*]:text-white" />
          <p className="max-w-xl text-sm leading-7 text-white/78">{isEnglish ? "Temperature-protected last-mile delivery for cosmetics and sensitive products in Riyadh, with operating scope defined before dispatch." : company.promise}</p>
          <p className="text-xs text-white/60">{isEnglish ? `Commercial registration: ${company.crNumber} · Unified number: ${company.unifiedNumber}` : `السجل التجاري: ${company.crNumber} · الرقم الموحد: ${company.unifiedNumber}`}</p>
        </div>
        <div>
          <h3 className="font-semibold">{isEnglish ? "Links" : "روابط"}</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">{isEnglish ? "Contact" : "التواصل"}</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76 ltr text-left">
            <a href={`mailto:${company.emails.general}`}>{company.emails.general}</a>
            <a href={`mailto:${company.emails.sales}`}>{company.emails.sales}</a>
            <a href={`mailto:${company.emails.ops}`}>{company.emails.ops}</a>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/76">{isEnglish ? "Riyadh, Saudi Arabia" : company.address}</p>
        </div>
      </div>
    </footer>
  );
}
