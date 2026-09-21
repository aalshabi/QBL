import { SITE } from "@/lib/site";

export function OrganizationJsonLd() {
  const url = `https://${SITE.domain}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.brandLong,
    alternateName: SITE.brand,
    legalName: SITE.brandLong,
    url,
    logo: `${url}/brand/qbl-wordmark.svg`,
    email: SITE.emails.info,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address,
      addressLocality: SITE.city,
      postalCode: SITE.postalCode,
      addressCountry: "SA",
    },
    identifier: [
      { "@type": "PropertyValue", propertyID: "CR", value: SITE.cr },
      { "@type": "PropertyValue", propertyID: "Unified National Number", value: SITE.unifiedNo },
    ],
    areaServed: {
      "@type": "City",
      name: SITE.city,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.phone,
        email: SITE.emails.info,
        contactType: "customer service",
        areaServed: "SA",
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
