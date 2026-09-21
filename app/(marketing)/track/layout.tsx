import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تتبع شحنتك | QBL",
  description: "ابحث عن حالة شحنتك في QBL برقم الشحنة وآخر 4 أرقام من الجوال.",
  alternates: { canonical: "/track" },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
