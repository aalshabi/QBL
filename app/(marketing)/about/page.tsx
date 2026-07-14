import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "من نحن — قدام بابك QBL",
  description:
    "شركة سعودية من الرياض تأسست حول سؤال واحد: من يحمي منتج التجميل من حرارة السعودية في آخر ميل؟ الجواب أصبح Beauty Shield.",
  alternates: { canonical: "/about" },
};

const principles = [
  { title: "التخصص قبل التوسع", desc: "قطاع واحد نتقنه بدل عشرة قطاعات نلمّ بها." },
  { title: "الإثبات قبل الادعاء", desc: "لا ننشر قدرة قبل تشغيلها، ولا نعد بنتيجة قبل توثيقها." },
  {
    title: "الشفافية في الحدود",
    desc: "نطاقنا الرياض، حد الطرد 25 كجم، والاستثناءات تُقيّم قبل القبول — ونقول ذلك بوضوح.",
  },
  { title: "التجربة قبل العقد", desc: "كل علاقة تبدأ بتشغيل محدود وتقرير، ثم قرارك." },
];

const official = [
  { label: "الاسم القانوني", value: SITE.brandLong },
  { label: "السجل التجاري", value: SITE.cr },
  { label: "المقر", value: SITE.address },
  { label: "العنوان الوطني المختصر", value: SITE.shortAddress },
  { label: "البريد", value: SITE.emails.info },
  { label: "الهاتف", value: SITE.phone },
  { label: "الموقع", value: SITE.domainDisplay },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "" },
          { name: "من نحن", path: "about" },
        ])}
      />
      <PageHero
        eyebrow="من نحن"
        title="تأسسنا حول مشكلة واحدة لم يكن أحد يملكها"
        description="في سوق تنمو فيه علامات التجميل والمتاجر الإلكترونية بسرعة، بقيت حلقة واحدة بلا صاحب: آخر ميل تحت حرارة السعودية."
        ctaHref="/trial"
        ctaLabel="ابدأ تجربة Beauty Shield"
      />

      <Section eyebrow="القصة" title="حلقة واحدة بلا صاحب: آخر ميل تحت حرارة السعودية">
        <div className="grid max-w-3xl gap-5 text-lg leading-8 text-slatebrand">
          <p>
            سيروم يُحفظ بعناية في مستودع مكيف، ثم يقضي ساعات في صندوق مركبة ظهيرة الصيف. علامات تستثمر في التركيبة والعبوة
            والتجربة، ثم تسلّم منتجها لتوصيل لا يفرق بين عبوة سيروم وقطعة غيار.
          </p>
          <p>
            قدام بابك QBL تأسست في الرياض لتملك هذه الحلقة تحديداً: نقل محكوم حرارياً لمستحضرات التجميل ومنتجات العناية
            الحساسة، من مستودع العلامة حتى باب العميل.
          </p>
        </div>
      </Section>

      <Section eyebrow="ماذا نفعل؟" title="نشغّل Beauty Shield" tone="mist">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          منظومة حماية بثلاثة مستويات تُبنى حول تعليمات حفظ كل منتج، لا حول نطاق واحد للجميع. نستلم من مستودعك، نجهّز
          حرارياً، نوصل خلال 24–72 ساعة داخل الرياض، ونسلّم بتوثيق إلكتروني — مع شحن عكسي وتحصيل عند الاستلام عند الحاجة.
        </p>
      </Section>

      <Section eyebrow="كيف نعمل؟" title="أربعة مبادئ نلتزم بها">
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-white p-6">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg font-extrabold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slatebrand">{item.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="البيانات الرسمية" title="بيانات الشركة" tone="mist">
        <div className="grid gap-3 sm:grid-cols-2">
          {official.map((row) => (
            <div key={row.label} className="rounded-lg border border-line bg-white p-4">
              <p className="text-xs font-bold text-accent">{row.label}</p>
              <p className="mt-1 text-sm font-medium text-primary">{row.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand title="جاهز نبدأ؟ ابدأ بتجربة محدودة على منتجاتك الفعلية." />
    </>
  );
}
