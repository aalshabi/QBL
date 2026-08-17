import type { Metadata, Viewport } from "next";
import { Montserrat, Tajawal } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  weight: ["400", "500", "700", "800"],
  subsets: ["arabic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "قدام بابك | QBL Logistics",
  description: "منصة QBL للتوصيل المبرّد آخر ميل في الرياض مع تتبع لحظي وكود استلام.",
  applicationName: "QBL",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
  appleWebApp: { capable: true, title: "QBL", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0D1B3A",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PwaRegister />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
