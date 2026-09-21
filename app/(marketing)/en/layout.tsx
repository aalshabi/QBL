import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "QBL — Refrigerated Last-Mile Delivery in Riyadh",
    template: "%s | QBL",
  },
  description:
    "QBL — Qaddam Babak Logistics. Refrigerated last-mile delivery in Riyadh for temperature-sensitive products, with disciplined operations and clear delivery handoff.",
  alternates: { canonical: "/en", languages: { ar: "/" } },
  openGraph: {
    title: "QBL — Refrigerated Last-Mile Delivery in Riyadh",
    description: "Refrigerated last-mile delivery in Riyadh for temperature-sensitive products.",
    url: "https://qbl.sa/en",
    type: "website",
    locale: "en_US",
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="ltr" className="text-left" lang="en">
      {children}
    </div>
  );
}
