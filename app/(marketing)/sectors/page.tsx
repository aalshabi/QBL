import type { Metadata } from "next";
import {
  Building2,
  Globe,
  type LucideIcon,
  Pill,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "قطاعات التجميل التي تخدمها QBL في الرياض",
  description:
    "حلول آخر ميل محكومة حرارياً للعلامات العالمية والموزعين والمتاجر الإلكترونية وD2C والصيدليات والعيادات والصالونات في الرياض.",
  alternates: { canonical: "/sectors" },
};

const sectors: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Globe,
    title: "العلامات التجارية العالمية",
    desc: "منتجك يحمل اسماً بُني بعقود. آخر ميل عندنا يُدار بمعايير توثيق واستلام وتسليم تناسب هذا الاسم، مع رحلات مخصصة عند الحاجة.",
  },
  {
    icon: Truck,
    title: "موزعو مستحضرات التجميل",
    desc: "توزيع من مستودعك إلى نقاط البيع والفروع بشحنات منتظمة، مع فصل الفئات الحرارية وتوثيق التسليم لكل نقطة.",
  },
  {
    icon: ShoppingBag,
    title: "المتاجر الإلكترونية",
    desc: "طلبات يومية متغيرة الحجم تصل لعملائك خلال 24–72 ساعة، بحماية تناسب كل منتج، وتحصيل عند الاستلام عند الحاجة، وشحن عكسي منظم للمرتجعات.",
  },
  {
    icon: Sparkles,
    title: "شركات D2C",
    desc: "علامتك تبيع مباشرة، وتجربة التسليم جزء من منتجك. نصمم نموذج التشغيل حول وعدك لعميلك — من شكل الاستلام إلى توثيق لحظة التسليم.",
  },
  {
    icon: Pill,
    title: "سلاسل الصيدليات",
    desc: "منتجات العناية الحساسة (Dermocosmetics) تحتاج التزاماً بتعليمات حفظ دقيقة بين المستودع والفروع. نلتزم بها ونوثقها.",
  },
  {
    icon: Building2,
    title: "عيادات الجلدية والتجميل",
    desc: "مستحضرات احترافية عالية القيمة بكميات محسوبة. رحلات منظمة أو مخصصة، مع تسليم موثق لمسؤول محدد في العيادة.",
  },
  {
    icon: Scissors,
    title: "الصالونات ومراكز العناية",
    desc: "تزويد دوري بمنتجات الاستخدام الاحترافي، بجدولة تناسب أيام الذروة لديك.",
  },
  {
    icon: Store,
    title: "العلامات السعودية الناشئة",
    desc: "بدأت صغيراً ومنتجك حساس؟ التجربة التشغيلية صُممت لك: عدد محدود من الطلبات، تقرير واضح، ثم قرار — بلا التزام طويل مسبق.",
  },
];

export default function SectorsPage() {
  return (
    <>
      <PageHero
        eyebrow="القطاعات"
        title="كل قطاع تجميلي له نموذج تشغيل مختلف — ونحن نعرف الفرق"
        description="من العلامات العالمية إلى الصالونات، نبني نموذج التشغيل حول طبيعة كل قطاع ومنتجاته وتعليمات حفظها."
        ctaHref="/trial"
        ctaLabel="ابدأ تجربة Beauty Shield"
      />

      <Section title="قطاعات نخدمها داخل الرياض" eyebrow="من نخدم">
        <div className="grid gap-4 md:grid-cols-2">
          {sectors.map((sector, index) => (
            <article key={sector.title} className="rounded-lg border border-line bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                  <sector.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-primary">{sector.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slatebrand">{sector.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="قطاعات أخرى؟" title="منتجات حساسة للحرارة خارج قطاع التجميل" tone="mist">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          نخدم منتجات حساسة للحرارة خارج قطاع التجميل عبر المبيعات المباشرة — تواصل معنا على{" "}
          <a className="font-bold text-accent ltr" href={`mailto:${SITE.emails.info}`}>
            {SITE.emails.info}
          </a>
          .
        </p>
      </Section>

      <CtaBand title="اختر قطاعك، ونبني نموذج تشغيل يناسب منتجاتك وتعليمات حفظها." />
    </>
  );
}
