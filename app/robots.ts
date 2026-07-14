import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/*", "/api/*", "/login", "/courier", "/courier/*", "/ops"],
    },
    sitemap: "https://qbl.sa/sitemap.xml",
  };
}
