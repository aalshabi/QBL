import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const ROUTES: { path: string; priority: number; changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]> }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/services/beauty-shield", priority: 0.9, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sectors", priority: 0.6, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.5, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.5, changeFrequency: "monthly" },
  { path: "/fleet-tech", priority: 0.5, changeFrequency: "monthly" },
  { path: "/cold-chain-system", priority: 0.4, changeFrequency: "monthly" },
  { path: "/compliance", priority: 0.4, changeFrequency: "monthly" },
  { path: "/company-profile", priority: 0.4, changeFrequency: "monthly" },
  { path: "/sla", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/track", priority: 0.3, changeFrequency: "yearly" },
  { path: "/en", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${SITE.domain}`;
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
