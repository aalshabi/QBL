import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { organizationAndLocalBusinessJsonLd } from "@/lib/structured-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qbl.sa"),
  title: {
    default: "نقل مبرد لمستحضرات التجميل في الرياض — QBL",
    template: "%s — QBL",
  },
  description:
    "QBL Beauty Shield — نقل محكوم حرارياً ومبرد لمستحضرات التجميل ومنتجات العناية الحساسة، من مستودع علامتك حتى باب العميل داخل الرياض.",
  applicationName: "QBL Beauty Shield",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "QBL",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1B3A",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationAndLocalBusinessJsonLd()} />
        <PwaRegister />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
