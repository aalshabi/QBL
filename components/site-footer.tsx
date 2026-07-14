import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { FOOTER_LINKS, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-primary text-primary-foreground no-print">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandLogo className="[&_*]:text-white" />
          <p className="max-w-xl text-sm leading-7 text-white/78">
            QBL Beauty Shield — نقل محكوم حرارياً ومبرد لمستحضرات التجميل ومنتجات العناية الحساسة، من مستودع علامتك حتى باب العميل داخل الرياض.
          </p>
          <p className="text-xs leading-6 text-white/60">
            {SITE.brandLong} · السجل التجاري: {SITE.cr}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">روابط</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">التواصل</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/76">
            <a href={`mailto:${SITE.emails.info}`} className="ltr text-left hover:text-white">
              {SITE.emails.info}
            </a>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="ltr text-left hover:text-white">
              {SITE.phone}
            </a>
            <p className="leading-7">{SITE.address}</p>
          </div>
          <Link
            href="/trial"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            اطلب تقييم المنتج والمسار
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/55 sm:px-6 lg:px-8">
          © {SITE.brandFull} — {SITE.domainDisplay}
        </div>
      </div>
    </footer>
  );
}
