import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";
import { sectors } from "@/lib/company";

export const metadata: Metadata = {
  title: "القطاعات التي نخدمها: غذاء ودواء وتجزئة | QBL",
  description:
    "نخدم القطاعات الحساسة للوقت ودرجة الحرارة في الرياض: الموردون الغذائيون، الصيدليات، متاجر التجزئة، التجارة الإلكترونية، والضيافة.",
  alternates: { canonical: "/sectors" },
};

export default function SectorsPage() {
  return (
    <ContentPage
      eyebrow="القطاعات المستهدفة"
      title="نخدم القطاعات التي تتأثر مباشرة بالوقت ودرجة الحرارة"
      description="يركز نموذج QBL على آخر ميل مبرد للشركات التي تريد الحفاظ على الجودة من نقطة الخروج حتى باب العميل."
      items={sectors.map((sector) => ({
        title: sector,
        description: "تشغيل مبرّد مع تتبع لحظي، قراءات حرارة عند توفرها، وإثبات تسليم بكود استلام.",
      }))}
    />
  );
}
