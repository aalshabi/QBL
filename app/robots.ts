import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * يمنع أرشفة كل ما يحمل بيانات عميل أو واجهة داخلية. الأهم /track/ — رابط التتبع
 * يحمل توكناً موقّعاً في المسار، وأرشفته تجعل شحنة عميل قابلة للاكتشاف بالبحث.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
