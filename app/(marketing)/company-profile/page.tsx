import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSignature,
  Globe2,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Store,
  Sun,
  Thermometer,
  Truck,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { BrandLogo } from "@/components/brand-logo";
import { PrintProfileButton } from "@/components/marketing/print-profile-button";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "بروفايل شركة QBL — Cosmetics Cold Chain Logistics",
  description:
    "الملف التعريفي لشركة قدام بابك QBL: Beauty Shield للنقل المحمي حرارياً والمبرد لمستحضرات التجميل خلال آخر ميل داخل الرياض.",
  alternates: { canonical: "/company-profile" },
};

const protectionLevels = [
  {
    icon: Sun,
    number: "01",
    name: "Heat Protected",
    title: "حماية من الحرارة",
    description:
      "حماية من الشمس المباشرة وحرارة المركبة وتقليل زمن التعرض، للمنتجات التي لا تشترط نطاقاً رقمياً محدداً.",
  },
  {
    icon: Thermometer,
    number: "02",
    name: "Temperature Controlled",
    title: "درجة حرارة محكومة",
    description:
      "نطاق مستهدف يُبنى على تعليمات المصنّع، مع أدوات عزل وقياس وتوثيق عند تضمينها في نموذج التشغيل.",
  },
  {
    icon: Snowflake,
    number: "03",
    name: "Refrigerated Delivery",
    title: "توصيل مبرد",
    description:
      "للمنتجات التي تنص تعليماتها على التبريد، بعد التحقق من قدرة المسار والكمية والمدة وتوثيقها في الاتفاقية.",
  },
];

const journey = [
  { icon: ClipboardCheck, title: "مراجعة المنتج", text: "تعليمات الحفظ والحساسية والعبوة." },
  { icon: ShieldCheck, title: "اختيار الحماية", text: "مستوى مناسب لكل فئة منتجات." },
  { icon: PackageCheck, title: "استلام منظم", text: "تحقق من الحالة ونقطة الاستلام." },
  { icon: Truck, title: "رحلة محمية", text: "مسار يقلل زمن التعرض الحراري." },
  { icon: FileSignature, title: "تسليم موثق", text: "توقيع إلكتروني حسب نموذج التشغيل." },
  { icon: RotateCcw, title: "شحن عكسي", text: "مرتجعات ضمن منظومة الحماية." },
];

const audiences = [
  { icon: Globe2, title: "العلامات العالمية" },
  { icon: Truck, title: "موزعو منتجات العناية" },
  { icon: ShoppingBag, title: "المتاجر الإلكترونية" },
  { icon: Sparkles, title: "شركات D2C" },
  { icon: Building2, title: "سلاسل الصيدليات والعيادات" },
  { icon: Store, title: "الصالونات ومراكز العناية" },
];

const capabilities = [
  "توصيل B2B وB2B2C داخل الرياض.",
  "نماذج حماية تختلف حسب المنتج وتعليمات المصنّع.",
  "تسليم خلال 24–72 ساعة وفق نموذج التشغيل.",
  "حتى ثلاث محاولات توصيل لكل شحنة.",
  "تحصيل عند الاستلام عند تفعيله ضمن الاتفاق.",
  "شحن عكسي منظم للمرتجعات.",
  "نقطة تواصل ومسار تصعيد واضحان.",
  "تجربة تشغيل محدودة قبل الالتزام طويل الأجل.",
];

const quality = [
  "تعليمات الشركة المصنّعة هي المرجع الحراري الأول.",
  "تسجيل الاستلام والتسليم والاستثناءات وفق النموذج المتفق عليه.",
  "توثيق درجات الحرارة عند تضمين القياس في نطاق الخدمة.",
  "إجراء واضح للإبلاغ عن الانحراف الحراري ومعالجته.",
  "فصل المنتجات غير المتوافقة حرارياً أو تشغيلياً.",
  "لا ندّعي اعتماداً أو قدرة أو نتيجة غير موثقة.",
];

const facts = [
  ["الاسم القانوني", SITE.brandLong],
  ["العلامة التجارية", "QBL — قدام بابك"],
  ["الخدمة المتخصصة", "QBL Beauty Shield"],
  ["النطاق الحالي", "مدينة الرياض"],
  ["السجل التجاري", SITE.cr],
  ["العنوان المختصر", SITE.shortAddress],
];

export default function CompanyProfilePage() {
  return (
    <main className="profile-page bg-white print-profile">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "" },
          { name: "بروفايل الشركة", path: "company-profile" },
        ])}
      />

      <section className="profile-sheet profile-cover relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 brand-grid opacity-15" aria-hidden="true" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[42px] border-accent/15" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[720px] max-w-7xl flex-col justify-between px-6 py-10 sm:px-10 lg:min-h-[820px] lg:px-16 lg:py-14">
          <div className="flex items-start justify-between gap-6">
            <BrandLogo className="[&_*]:text-white" />
            <div className="no-print hidden sm:block">
              <PrintProfileButton />
            </div>
          </div>

          <div className="max-w-4xl py-16">
            <p className="text-sm font-bold tracking-wide text-accent">COMPANY PROFILE · 2026</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
              Cosmetics Cold Chain.
              <br />
              Built for Saudi Heat.
            </h1>
            <p className="mt-7 max-w-3xl text-xl font-bold leading-9 text-white/90 sm:text-2xl">
              حماية حرارية متخصصة لمستحضرات التجميل ومنتجات العناية — من مستودع علامتك حتى باب العميل.
            </p>
            <div className="mt-9 flex flex-wrap gap-2 text-sm text-white/75">
              {["Beauty Shield", "Last-Mile Cold Chain", "Temperature Controlled Delivery", "Riyadh"].map((item) => (
                <span key={item} className="rounded-full border border-white/20 bg-white/8 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 border-t border-white/15 pt-6 text-sm text-white/70 sm:grid-cols-3">
            <p>QBL — Qaddam Babak Logistics</p>
            <p className="ltr sm:text-center">{SITE.domainDisplay}</p>
            <p className="sm:text-left">الرياض، المملكة العربية السعودية</p>
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-frost-50">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="01"
            eyebrow="هويتنا الحقيقية"
            title="لسنا شركة شحن تقليدية"
            description="QBL مزود متخصص في حماية مستحضرات التجميل ومنتجات العناية الحساسة للحرارة خلال آخر ميل داخل الرياض. Beauty Shield هي المنظومة التي تحول تعليمات حفظ المنتج إلى نموذج تشغيل قابل للتنفيذ والتوثيق."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl bg-primary p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-accent">وعد العلامة</p>
              <p className="mt-4 text-2xl font-extrabold leading-10 sm:text-3xl">
                نحمي جودة منتجك من حرارة السعودية حتى يصل بالصورة التي صنعتها علامتك.
              </p>
              <p className="mt-5 leading-8 text-white/70">
                لا نبيع تبريداً موحداً لكل طرد. نراجع المنتج أولاً، ثم نحدد مستوى الحماية المناسب والقياس المطلوب وحدود المسؤولية قبل التشغيل.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-xs font-bold text-accent">{label}</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="02"
            eyebrow="المشكلة التي نملكها"
            title="آخر ميل قد يكون أقسى مرحلة في رحلة المنتج"
            description="قد يغادر المنتج مستودعاً مكيفاً بحالة مثالية، ثم يتعرض للشمس أو حرارة صندوق المركبة أو انتظار طويل بين نقاط التسليم. النتيجة المحتملة ليست تلف المنتج فقط؛ بل شكوى ومرتجع وتعويض وثقة تتآكل."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              [Thermometer, "التركيبة", "المكونات النشطة والقوام قد يتأثران بالتعرض الحراري."],
              [Sparkles, "تجربة العميل", "الرائحة واللون والملمس أول ما يلاحظه العميل."],
              [PackageCheck, "العبوة", "الملصقات والأغطية والزجاج جزء من انطباع العلامة."],
              [RotateCcw, "الهامش", "كل شكوى تعني وقتاً ومرتجعاً وشحنة بديلة محتملة."],
            ].map(([Icon, title, text]) => {
              const CardIcon = Icon as typeof Thermometer;
              return (
                <article key={String(title)} className="rounded-xl border border-line bg-frost-50 p-6">
                  <CardIcon className="h-6 w-6 text-accent" />
                  <h3 className="mt-5 text-lg font-extrabold text-primary">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-7 text-slatebrand">{String(text)}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-8 border-r-4 border-accent bg-primary px-6 py-5 text-xl font-extrabold leading-9 text-white">
            حماية آخر ميل ليست تكلفة إضافية عندما تكون جودة المنتج وسمعة العلامة معرضتين للخطر.
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-frost-50">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="03"
            eyebrow="QBL Beauty Shield"
            title="ثلاثة مستويات. مرجع واحد: تعليمات المصنّع"
            description="لا يوجد نطاق واحد يناسب كل مستحضرات التجميل. نختار المستوى بناءً على تعليمات الحفظ، حساسية المنتج، مدة الرحلة، وظروف الموسم."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {protectionLevels.map((level, index) => (
              <article
                key={level.name}
                className={`flex flex-col rounded-xl border bg-white p-7 ${index === 1 ? "border-accent shadow-lg" : "border-line"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-frost text-accent">
                    <level.icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-sm font-bold text-accent">{level.number}</span>
                </div>
                <p className="mt-7 ltr text-right text-xl font-extrabold text-primary">{level.name}</p>
                <h3 className="mt-1 text-sm font-bold text-accent">{level.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slatebrand">{level.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 rounded-lg border border-amber/35 bg-white p-5 text-sm leading-7 text-slatebrand">
            <strong className="text-primary">مهم:</strong> القياس والتسجيل والنطاق الحراري والتبريد الفعلي لا تُفترض تلقائياً؛ تُحدد وتوثق ضمن نموذج التشغيل المتفق عليه لكل عميل.
          </p>
        </div>
      </section>

      <section className="profile-sheet bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="04"
            eyebrow="القدرات التشغيلية"
            title="خدمة كاملة حول الشحنة — لا مجرد سائق ومركبة"
            description="نربط الحماية الحرارية بالتسليم والتوثيق والمرتجعات والتصعيد؛ لأن تجربة العميل النهائي جزء من جودة المنتج."
          />
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm font-medium leading-7 text-primary">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, index) => (
              <article key={step.title} className="rounded-xl bg-primary p-6 text-white">
                <div className="flex items-center justify-between">
                  <step.icon className="h-6 w-6 text-accent" />
                  <span className="font-mono text-xs text-white/40">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/65">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-frost-50">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="05"
            eyebrow="لمن صُممت الخدمة؟"
            title="تشغيل يتغير حسب قناة البيع وطبيعة المنتج"
            description="العلامة العالمية لا تحتاج النموذج نفسه الذي تحتاجه شركة D2C أو صالون. نبدأ من المنتج والوعد المقدم للعميل وحجم الطلبات، ثم نبني التشغيل."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <article key={audience.title} className="flex items-center gap-4 rounded-xl border border-line bg-white p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-frost text-accent">
                  <audience.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-primary">{audience.title}</h3>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-7">
              <p className="text-sm font-bold text-accent">منتجات مناسبة للتقييم</p>
              <p className="mt-3 leading-8 text-slatebrand">
                السيروم، فيتامين C ومشتقاته، الكريمات والمرطبات الحساسة، المستحضرات العضوية والطبيعية، المنتجات الاحترافية للصالونات والعيادات، العينات التسويقية، والعبوات الزجاجية الفاخرة.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white p-7">
              <p className="text-sm font-bold text-accent">منتجات تتطلب تقييماً خاصاً</p>
              <p className="mt-3 leading-8 text-slatebrand">
                العطور والمنتجات المحتوية على الكحول والمواد ذات الاشتراطات الخاصة تُراجع قبل القبول، وقد تتطلب ملحقاً تشغيلياً مستقلاً.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="06"
            eyebrow="الجودة والاستعداد التنظيمي"
            title="الإثبات قبل الادعاء"
            description="نبني الجودة كسجلات وإجراءات وحدود مسؤولية واضحة. لا نعرض اعتماداً أو نتيجة أو قدرة لم تُثبت بعد."
          />
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {quality.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm leading-7 text-slatebrand">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl bg-primary p-7 text-white">
            <p className="text-sm font-bold text-accent">حدود التشغيل الحالية</p>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-white/75 sm:grid-cols-3">
              <p>النطاق الجغرافي الحالي: داخل مدينة الرياض.</p>
              <p>الحد الأقصى المعلن لوزن الطرد: 25 كجم.</p>
              <p>القدرات الخاصة تُقبل بعد تحقق تشغيلي واتفاق مكتوب.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-sheet bg-frost-50">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <ProfileHeading
            number="07"
            eyebrow="نموذج البدء"
            title="ابدأ بتجربة، لا بعقد طويل"
            description="نختبر النموذج على منتجات وطلبات فعلية، ثم تتخذ قرارك بناءً على تقرير واضح بدلاً من وعود عامة."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              "ترسل قائمة المنتجات وتعليمات حفظها.",
              "نراجع الحساسية ونقترح مستوى الحماية.",
              "نحدد نطاق التجربة والمسارات والتوثيق.",
              "ننفذ عدداً محدوداً من الطلبات الفعلية.",
              "نصدر تقريراً بالنتائج والاستثناءات.",
              "نقترح نموذج التشغيل الشهري — والقرار لك.",
            ].map((step, index) => (
              <li key={step} className="rounded-xl border border-line bg-white p-6">
                <span className="font-mono text-sm font-bold text-accent">0{index + 1}</span>
                <p className="mt-4 text-sm font-bold leading-7 text-primary">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl border border-accent/30 bg-white p-7">
            <p className="text-lg font-extrabold text-primary">معيار النجاح يُتفق عليه قبل التجربة.</p>
            <p className="mt-3 leading-8 text-slatebrand">
              نطاق الحرارة والتوثيق وزمن التسليم والاستثناءات ومسؤولية كل طرف تُكتب بوضوح. لا نستخدم نسب خفض للمرتجعات أو ادعاءات أداء قبل توفر بيانات فعلية قابلة للمراجعة.
            </p>
          </div>
        </div>
      </section>

      <section className="profile-sheet profile-contact relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 brand-grid opacity-15" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-between px-6 py-14 sm:px-10 lg:min-h-[720px] lg:px-16 lg:py-20">
          <div>
            <p className="text-sm font-bold text-accent">LET&apos;S PROTECT THE LAST MILE</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">
              منتجك يستحق أن يصل كما صُمم.
            </h2>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-white/75">
              أرسل تعليمات حفظ منتجاتك ومسارات التوصيل. نراجعها ونقترح مستوى Beauty Shield المناسب لتجربة محدودة داخل الرياض.
            </p>
            <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trial"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-primary transition-colors hover:bg-accent/90"
              >
                ابدأ تجربة Beauty Shield
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link
                href="/protection-levels"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                راجع مستويات الحماية
              </Link>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/15 pt-7 sm:grid-cols-2 lg:grid-cols-4">
            <ContactItem icon={Mail} label="البريد" value={SITE.emails.info} href={`mailto:${SITE.emails.info}`} ltr />
            <ContactItem icon={Phone} label="الهاتف" value={SITE.phone} href={`tel:${SITE.phone.replace(/\s/g, "")}`} ltr />
            <ContactItem icon={MapPin} label="المقر" value="الرياض، المملكة العربية السعودية" />
            <ContactItem icon={Building2} label="السجل التجاري" value={SITE.cr} ltr />
          </div>

          <div className="flex items-end justify-between gap-6 pt-10">
            <BrandLogo className="[&_*]:text-white" />
            <p className="ltr text-sm text-white/55">{SITE.domainDisplay}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.18fr_1fr]">
      <p className="font-mono text-4xl font-bold text-accent/35">{number}</p>
      <div className="max-w-4xl">
        <p className="text-sm font-bold text-accent">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-8 text-slatebrand">{description}</p>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
  ltr = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-xs text-white/50">{label}</p>
      <p className={`mt-1 text-sm font-bold leading-6 text-white ${ltr ? "ltr text-right" : ""}`}>{value}</p>
    </>
  );

  return href ? (
    <a href={href} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
      {content}
    </a>
  ) : (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">{content}</div>
  );
}
