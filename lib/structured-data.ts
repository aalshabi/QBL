import { SITE } from "@/lib/site";

const BASE_URL = "https://qbl.sa";

const address = {
  "@type": "PostalAddress",
  streetAddress: `مبنى ${SITE.buildingNo}، طريق أبي عبيدة عامر بن الجراح`,
  addressLocality: "الرياض",
  addressRegion: "الرياض",
  postalCode: SITE.postalCode,
  addressCountry: "SA",
};

export function organizationAndLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: SITE.brandLong,
        alternateName: SITE.brand,
        url: BASE_URL,
        email: SITE.emails.info,
        telephone: SITE.phone,
        address,
      },
      {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#localbusiness`,
        name: SITE.brandLong,
        url: BASE_URL,
        telephone: SITE.phone,
        email: SITE.emails.info,
        address,
        areaServed: { "@type": "City", name: "الرياض" },
        parentOrganization: { "@id": `${BASE_URL}/#organization` },
      },
    ],
  };
}

export function beautyShieldServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "نقل محمي حرارياً لمستحضرات التجميل",
    name: "QBL Beauty Shield",
    provider: { "@id": `${BASE_URL}/#organization` },
    areaServed: { "@type": "City", name: "الرياض" },
    description:
      "نقل محكوم حرارياً ومبرد لمستحضرات التجميل ومنتجات العناية الحساسة، من مستودع العلامة حتى باب العميل داخل الرياض.",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? `${BASE_URL}/${item.path}` : BASE_URL,
    })),
  };
}
