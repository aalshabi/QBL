import { ContentPage } from "@/components/marketing/content-page";
import { company } from "@/lib/company";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { aboutSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "من نحن — شركة سعودية للتوصيل المبرّد آخر ميل في الرياض",
  description:
    "تعرّف على قدام بابك للخدمات اللوجستية: التوصيل المبرّد آخر ميل في الرياض، ورؤيتنا ورسالتنا ومنهج عملنا مع شركات B2B2C. تواصل مع فريق التشغيل.",
  path: "/about",
});

export default function AboutPage() {
  return (
      <>
        <JsonLd data={aboutSchema} />
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
      </>
  );
}
