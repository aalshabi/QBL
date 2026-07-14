import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/ops/", "/courier/", "/api/", "/reports/beauty-shield-sample", "/case-studies/beauty-shield-template"] },
    ],
    sitemap: "https://qbl.sa/sitemap.xml",
  };
}
