import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { company, marketingNav } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandLogo inverse />
          <p className="max-w-xl text-sm leading-7 text-white/78">{company.promise}</p>
          <p className="text-xs text-white/60">السجل التجاري: {company.crNumber} · الرقم الموحد: {company.unifiedNumber}</p>
        </div>
        <div>
          <h3 className="font-semibold">روابط سريعة</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            {marketingNav.slice(0, 6).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">التواصل</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76 ltr text-left">
            <a href={`mailto:${company.emails.general}`}>{company.emails.general}</a>
            <a href={`mailto:${company.emails.sales}`}>{company.emails.sales}</a>
            <a href={`mailto:${company.emails.ops}`}>{company.emails.ops}</a>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/76">{company.address}</p>
        </div>
      </div>
    </footer>
  );
}
