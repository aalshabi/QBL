import type { MetadataRoute } from "next";

const BASE_URL = "https://qbl.sa";

const routes = [
  { path: "", priority: 1 },
  { path: "beauty-shield", priority: 0.9 },
  { path: "company-profile", priority: 0.8 },
  { path: "why-protection", priority: 0.8 },
  { path: "protection-levels", priority: 0.8 },
  { path: "sectors", priority: 0.7 },
  { path: "how-it-works", priority: 0.7 },
  { path: "quality", priority: 0.6 },
  { path: "faq", priority: 0.7 },
  { path: "trial", priority: 0.9 },
  { path: "about", priority: 0.6 },
  { path: "cold-chain-system", priority: 0.5 },
  { path: "cold-chain-system/client-dashboard", priority: 0.3 },
  { path: "cold-chain-system/driver-app", priority: 0.3 },
  { path: "cold-chain-system/operations-dashboard", priority: 0.3 },
  { path: "track", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, priority }) => ({
    url: path ? `${BASE_URL}/${path}` : BASE_URL,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }));
}
