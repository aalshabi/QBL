// الحقائق المعتمدة فقط — المصدر lib/site.ts و lib/contact.ts. لا رقم خارجها.

import { CONTACT_EMAILS } from "@/lib/contact";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "طريق أبو عبيدة عامر بن الجراح، 4480",
  addressLocality: "الرياض",
  postalCode: "14256",
  addressCountry: "SA",
};

const AREA_SERVED = { "@type": "City", name: "الرياض" };

const IDENTIFIERS = [
  { "@type": "PropertyValue", name: "السجل التجاري", value: "1010985560" },
  { "@type": "PropertyValue", name: "الرقم الموحد", value: "7038401902" },
];

export const organizationSchema = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "QBL — قدام بابك للخدمات اللوجستية",
  legalName: "شركة قدام بابك للخدمات اللوجستية",
  alternateName: ["QBL", "قدام بابك", "Qaddam Babak Logistics"],
  url: SITE_URL,
  email: CONTACT_EMAILS.info,
  telephone: "+966556320555",
  address: POSTAL_ADDRESS,
  areaServed: AREA_SERVED,
  identifier: IDENTIFIERS,
};

export const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    organizationSchema,
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: "QBL",
      inLanguage: "ar-SA",
      publisher: { "@id": ORGANIZATION_ID },
    },
  ],
};

export const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: absoluteUrl("/about"),
  name: "من نحن — قدام بابك للخدمات اللوجستية",
  inLanguage: "ar-SA",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORGANIZATION_ID },
};

export const companyProfileSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: absoluteUrl("/company-profile"),
  name: "الملف التعريفي — شركة قدام بابك للخدمات اللوجستية",
  inLanguage: "ar-SA",
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: organizationSchema,
};

export const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: absoluteUrl("/contact"),
  name: "التواصل مع QBL",
  inLanguage: "ar-SA",
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: organizationSchema,
};

export const beautyShieldSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  url: absoluteUrl("/services/beauty-shield"),
  name: "QBL Beauty Shield — توصيل منتجات التجميل والعناية بحماية من حرارة الجو",
  serviceType: "توصيل منتجات التجميل والعناية بدرجة حرارة محمية",
  description:
    "خدمة توصيل داخل الرياض تستخدم حقيبة حرارية أو صندوق عازل أو تبريد خفيف حسب حساسية المنتج، مع توثيق استلام وتسليم لكل طلب.",
  areaServed: AREA_SERVED,
  provider: { "@id": ORGANIZATION_ID },
};

export const coldChainBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "النظام التشغيلي", item: absoluteUrl("/cold-chain-system") },
  ],
};
