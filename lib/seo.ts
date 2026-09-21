// أساس الاكتشاف: عنوان الموقع المطلق، وبنّاء metadata موحّد لكل صفحة عامة.
// الهدف أن يكون لكل صفحة عنوان ووصف و canonical فريد — الصفحات التي ترث ميتا
// الجذر تتنافس على نفس العنوان في نتائج البحث وتضيع جميعاً.

import type { Metadata } from "next";

export const SITE_URL = "https://qbl.sa";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  locale?: "ar_SA" | "en_US";
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  locale = "ar_SA",
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "QBL — قدام بابك",
      locale,
      url,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** الصفحات العامة القابلة للأرشفة — مصدر واحد يغذّي sitemap ويُختبر ضد المسارات الخاصة. */
export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/services/beauty-shield", priority: 0.9, changeFrequency: "monthly" },
  { path: "/cold-chain-system", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sectors", priority: 0.8, changeFrequency: "monthly" },
  { path: "/quote", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/company-profile", priority: 0.6, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/fleet-tech", priority: 0.6, changeFrequency: "monthly" },
  { path: "/compliance", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sla", priority: 0.6, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.5, changeFrequency: "monthly" },
  { path: "/track", priority: 0.5, changeFrequency: "monthly" },
  { path: "/en", priority: 0.5, changeFrequency: "monthly" },
];

/** مسارات لا تُؤرشف: بيانات عملاء، أو واجهات داخلية، أو مراجع تصميمية. */
export const PRIVATE_PATH_PREFIXES = [
  "/api/",
  "/admin",
  "/ops",
  "/courier",
  "/track/",
  "/login",
  "/offline",
  "/brand",
  "/cold-chain-system/client-dashboard",
  "/cold-chain-system/operations-dashboard",
  "/cold-chain-system/driver-app",
];
