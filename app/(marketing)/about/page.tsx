import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "من نحن | شركة قدام بابك للخدمات اللوجستية QBL",
  description:
    "شركة سعودية متخصصة في التوصيل المبرّد آخر ميل من الرياض، تأسست عام 2024 لخدمة الشركات التي تحتاج تسليماً مبرداً موثوقاً وقابلاً للقياس.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="من نحن"
      title="شركة سعودية متخصصة في التوصيل المبرّد آخر ميل من الرياض"
      description={`${company.tradeName} تأسست عام ${company.foundedYear} لتخدم الشركات التي تحتاج تسليمًا مبردًا موثوقًا، واضحًا، وقابلًا للقياس داخل الرياض.`}
      items={[
        { title: "الرؤية", description: company.vision },
        { title: "الرسالة", description: company.mission },
        { title: "الوعد التشغيلي", description: company.promise },
        { title: "القيم", description: company.values.join("، ") },
        { title: "الجمهور الأساسي", description: "شركات B2B2C التي تعتمد على سلامة المنتج وتجربة العميل النهائي." },
        { title: "منهج العمل", description: "ربط التتبع، درجة الحرارة، إسناد المندوب، وإثبات التسليم ضمن مسار تشغيلي واحد." },
      ]}
    />
  );
}
