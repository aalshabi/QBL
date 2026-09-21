import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تطبيق المندوب | QBL",
  robots: { index: false, follow: false },
};

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return children;
}
