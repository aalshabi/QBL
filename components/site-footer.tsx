import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { company, footerServiceLinks } from "@/lib/company";

const SECONDARY_LINKS = [
  { href: "/company-profile", label: "الملف التعريفي" },
  { href: "/why-us", label: "لماذا QBL" },
  { href: "/compliance", label: "الالتزام والجودة" },
  { href: "/sla", label: "مستوى الخدمة" },
  { href: "/case-studies", label: "دراسات حالة" },
  { href: "/en", label: "English" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandLogo inverse />
          <p className="max-w-xl text-sm leading-7 text-white/78">{company.promise}</p>
          <p className="text-xs text-white/60">السجل التجاري: {company.crNumber} · الرقم الموحد: {company.unifiedNumber}</p>
        </div>
        <div>
          <h3 className="font-semibold">الخدمات</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            {footerServiceLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          {/* صفحات كانت في sitemap ولا يصل إليها رابط واحد من داخل الموقع:
              الزاحف يجدها مُعلنة ومعزولة، والزائر لا يجدها أصلاً. */}
          <h3 className="font-semibold">الشركة</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            {SECONDARY_LINKS.map((item) => (
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
      {/* صفّ خدمي سفلي — دخول الفريق مدخل داخلي محايد، لا ينافس إجراءات العميل
          ولا يظهر كخدمة شحن. */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {company.officialName}. جميع الحقوق محفوظة.</p>
          <Link href="/team" className="hover:text-white/80">
            دخول الفريق
          </Link>
        </div>
      </div>
    </footer>
  );
}
