import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "قدام بابك للخدمات اللوجستية",
    short_name: "QBL",
    description: "توصيل مبرّد آخر ميل للشركات في الرياض مع تتبع مباشر وكود استلام.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    background_color: "#f8fafc",
    theme_color: "#0D1B3A",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar-SA",
    categories: ["business", "productivity", "navigation"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "تتبع شحنة",
        short_name: "تتبع",
        description: "فتح صفحة تتبع الشحنة",
        url: "/track",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
      {
        name: "لوحة العمليات",
        short_name: "العمليات",
        description: "فتح لوحة العمليات",
        url: "/ops",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
    ],
  };
}
