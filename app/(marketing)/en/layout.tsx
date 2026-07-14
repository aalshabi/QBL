import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "QBL — Refrigerated Last-Mile Delivery in Riyadh",
    template: "%s | QBL",
  },
  description:
    "QBL — Qaddam Babak Logistics. Refrigerated last-mile delivery in Riyadh for temperature-sensitive products, with disciplined operations and clear delivery handoff.",
  robots: { index: true, follow: true },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="ltr" className="text-left" lang="en">
      {children}
    </div>
  );
}
