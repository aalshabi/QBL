import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://qbl.sa";
  const paths = [
    "",
    "/services/beauty-shield",
    "/why-protection",
    "/riyadh-heat",
    "/sfda-readiness",
    "/trial",
    "/faq",
    "/about",
    "/services",
    "/sectors",
    "/fleet-tech",
    "/cold-chain-system",
    "/contact",
    "/en",
    "/en/beauty-shield",
    "/en/trial",
  ];
  return paths.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path.includes("beauty-shield") || path.includes("trial") ? 0.9 : 0.7 }));
}
