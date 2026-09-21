import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة العمليات | QBL",
  robots: { index: false, follow: false },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
