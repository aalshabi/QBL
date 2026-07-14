import { QblMark } from "@/components/Logo";
import Logo from "@/components/Logo";

export const metadata = {
  title: "نظام الهوية الحراري",
  description:
    "النظام البصري لـ QBL — قدّام بابك للخدمات اللوجستية: الشعار، الطيف الحراري، نقطة الدرجة، الخطوط، والتطبيق.",
  robots: { index: false, follow: false },
};

function ThermalRule({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const heights = [8, 14, 22, 14, 26, 12, 18, 9, 22, 13, 8];
  return (
    <div className={`thermal-rule ${onDark ? "thermal-rule--on-dark" : ""} ${className}`}>
      {heights.map((h, i) => (
        <i
          key={i}
          style={{
            height: `${h}px`,
            opacity: i === 4 ? 1 : undefined,
            background:
              i === 4 ? (onDark ? "#7FE3EC" : "#3FCBD6") : undefined,
          }}
        />
      ))}
    </div>
  );
}

function Eyebrow({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className={`eyebrow ${onDark ? "eyebrow--on-dark" : ""}`}>
      <span className="eyebrow-deg" />
      {children}
    </div>
  );
}

export default function BrandPage() {
  return (
    <main className="bg-white pb-24">
      <header className="mx-auto max-w-[1120px] px-6 pt-14 pb-4 sm:px-10">
        <div
          className="relative overflow-hidden rounded-[28px] px-8 py-14 text-white sm:px-14 sm:py-16"
          style={{
            background:
              "radial-gradient(120% 120% at 85% -10%, rgba(0,167,182,.22), transparent 55%), linear-gradient(150deg, #0B1730 0%, #0D1B3A 55%, #12264a 100%)",
          }}
        >
          <div className="thermal-bg" />
          <div className="relative flex flex-wrap items-start justify-between gap-10">
            <div className="max-w-xl">
              <Eyebrow onDark>نظام الهوية</Eyebrow>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                الهوية الحرارية
                <br />
                لِـ <span className="ltr text-accent-light">QBL</span>
              </h1>
              <p className="mt-5 max-w-[46ch] text-base leading-7 text-white/70 sm:text-lg">
                قدّام بابك للخدمات اللوجستية — نظام بصري مبنيّ على سلسلة التبريد: الدرجة،
                الطيف الحراري، والانضباط.
              </p>
              <div className="mt-8">
                <ThermalRule onDark className="!h-7" />
              </div>
            </div>
            <div className="text-center">
              <QblMark dim={140} inverse />
              <p className="ltr mt-4 text-xs tracking-[0.22em] text-white/55">
                PRECISION AT EVERY DEGREE
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-6 sm:px-10">
        {/* 01 LOGO */}
        <section className="pt-16">
          <Eyebrow>٠١ — الشعار</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            وقمارك موحّد، مبنيّ على الدرجة
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-7 text-slatebrand">
            حرف الـ Q حلقةٌ مغلقة تعبّر عن سلسلة التبريد المُحكمة، يخرج منها ذيلٌ يتدرّج
            من التركوازي البارد إلى عمق الكحلي — ونقطة الدرجة{" "}
            <span className="deg-mark">°</span> أعلى يمين العلامة هي بصمة الهوية المتكررة.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex items-center justify-center rounded-[18px] border border-muted bg-white p-12">
              <Logo size="lg" />
            </div>
            <div className="flex items-center justify-center rounded-[18px] bg-ink p-12">
              <Logo size="lg" variant="white" />
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-[18px] border border-muted bg-white p-7 text-center">
              <div className="flex justify-center">
                <QblMark dim={96} />
              </div>
              <p className="mt-4 text-[13px] font-bold text-ink-600">
                الرمز المفرد — أيقونة / favicon
              </p>
            </div>
            <div className="surface-frost rounded-[18px] p-7 text-center">
              <div className="flex justify-center">
                <QblMark dim={96} />
              </div>
              <p className="mt-4 text-[13px] font-bold text-ink-600">على سطح الفروست</p>
            </div>
            <div className="rounded-[18px] bg-teal p-7 text-center">
              <div className="flex justify-center">
                <QblMark dim={96} inverse />
              </div>
              <p className="mt-4 text-[13px] font-bold text-white">العكس على التركوازي</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[18px] border border-muted bg-white p-7">
              <p className="text-[13px] font-bold text-[#1F8A5B]">✓ افعل</p>
              <ul className="mt-3 list-disc space-y-2 pr-5 text-[15px] leading-8 text-slatebrand">
                <li>احفظ مساحة حماية لا تقل عن ارتفاع نقطة الدرجة حول العلامة.</li>
                <li>استخدم النسخة البيضاء على الكحلي أو التركوازي فقط.</li>
                <li>
                  أبقِ نقطة الدرجة <span className="deg-mark">°</span> ظاهرة دائماً.
                </li>
              </ul>
            </div>
            <div className="rounded-[18px] border border-muted bg-white p-7">
              <p className="text-[13px] font-bold text-[#C2493D]">✕ تجنّب</p>
              <ul className="mt-3 list-disc space-y-2 pr-5 text-[15px] leading-8 text-slatebrand">
                <li>لا تفصل الـ Q عن BL أو تعيد ترتيبهما.</li>
                <li>لا تضف ظلال أو تدرّجات خارج الذيل المعتمد.</li>
                <li>لا تضع العلامة على خلفية منخفضة التباين.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 02 COLOR */}
        <section className="pt-20">
          <Eyebrow>٠٢ — الطيف الحراري</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            من البرودة إلى التنبيه
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-7 text-slatebrand">
            النظام اللوني يحاكي مقياس الحرارة: التركوازي = ضمن النطاق، الكحلي = العمق والثقة،
            والكهرماني = خارج النطاق — يُستخدم بندرة شديدة كإشارة تنبيه فقط.
          </p>

          <div className="mt-7 overflow-hidden rounded-2xl border border-muted">
            <div
              className="h-16"
              style={{
                background:
                  "linear-gradient(90deg,#0D1B3A 0%,#0A6B75 38%,#00A7B6 60%,#3FCBD6 78%,#F4A82E 100%)",
              }}
            />
            <div className="ltr flex justify-between px-4 py-2.5 text-xs text-slatebrand">
              <span>DEEP / CONTROL</span>
              <span>IN-RANGE COLD</span>
              <span>OUT-OF-RANGE</span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch name="Ink Navy" hex="#0D1B3A" bg="#0D1B3A" />
            <Swatch name="Cold Teal" hex="#00A7B6" bg="#00A7B6" />
            <Swatch name="Chill" hex="#3FCBD6" bg="#3FCBD6" inkText />
            <Swatch name="Alert Amber" hex="#F4A82E" bg="#F4A82E" inkText />
            <Swatch name="Frost" hex="#EAF7F8" bg="#EAF7F8" inkText bordered />
            <Swatch name="Slate" hex="#3A4653" bg="#3A4653" />
            <Swatch name="Mist" hex="#E6EBF0" bg="#E6EBF0" inkText />
            <Swatch name="Paper" hex="#FFFFFF" bg="#FFFFFF" inkText bordered />
          </div>
        </section>

        {/* 03 MOTIF */}
        <section className="pt-20">
          <Eyebrow>٠٣ — العنصر المميّز</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            الدرجة <span className="deg-mark">°</span> ومقياس الحرارة
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-7 text-slatebrand">
            عنصران متكرران يمنحان النظام بصمة لا تُنسى: نقطة الدرجة كنقطة تعداد وفاصل،
            ومقياس الحرارة (شُرَط متفاوتة) كقاعدة فاصلة بين الأقسام.
          </p>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[18px] border border-muted bg-white p-7">
              <p className="text-[13px] font-bold text-ink-600">نقطة الدرجة كعلامة تعداد</p>
              <ul className="mt-4 grid list-none gap-3 p-0">
                {[
                  "سلسلة تبريد ضمن نطاق متفق عليه",
                  "توثيق تسليم عند الحاجة",
                  "مناولة واعية بالحرارة",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-[15px] text-slatebrand"
                  >
                    <span className="block h-[9px] w-[9px] flex-none rounded-full border-[2.5px] border-teal" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[42px] font-extrabold leading-none tracking-[0.05em] text-ink">
                +2<span className="deg-mark">°</span> … +8
                <span className="deg-mark">°</span>
                <div className="mt-1.5 text-[13px] font-bold leading-none tracking-normal text-slatebrand">
                  نطاق التبريد القياسي
                </div>
              </div>
            </div>
            <div className="surface-frost flex flex-col justify-between rounded-[18px] p-7">
              <p className="text-[13px] font-bold text-ink-600">
                مقياس الحرارة — فاصل الأقسام
              </p>
              <div>
                <div className="mt-7 flex h-[60px] items-end gap-[6px]">
                  {[16, 28, 44, 24, 52, 20, 36, 16, 48, 26, 14, 34, 20, 44, 16].map(
                    (h, i) => (
                      <i
                        key={i}
                        className="block w-[2px] rounded-[2px]"
                        style={{
                          height: `${h}px`,
                          background: i === 4 ? "#00A7B6" : "#00A7B6",
                          opacity: i === 4 ? 1 : i === 2 ? 0.85 : 0.55,
                        }}
                      />
                    )
                  )}
                </div>
                <p className="mt-5 text-sm leading-7 text-slatebrand">
                  يُستخدم كقاعدة رفيعة أسفل العناوين الكبيرة وفي تذييل الأقسام، بإيقاع غير
                  منتظم يوحي بقراءة مستشعر حراري.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 04 TYPE */}
        <section className="pt-20">
          <Eyebrow>٠٤ — الخطوط</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            Tajawal للعربية · Montserrat للّاتينية والأرقام
          </h2>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[18px] border border-muted bg-white p-7">
              <p className="text-[13px] font-bold text-ink-600">Tajawal — العربية</p>
              <div className="mt-5 leading-none">
                <div className="text-4xl font-extrabold">مبرّد. مضبوط.</div>
                <div className="mt-3 text-2xl font-bold text-ink-700">
                  قدّام بابك للخدمات اللوجستية
                </div>
                <div className="mt-4 text-base font-normal leading-7 text-slatebrand">
                  نص الجسم — توصيل مبرّد آخر ميل في الرياض للشركات التي تتعامل مع منتجات
                  حساسة للحرارة.
                </div>
              </div>
            </div>
            <div className="rounded-[18px] border border-muted bg-white p-7">
              <p className="text-[13px] font-bold text-ink-600">
                Montserrat — Latin & Numerals
              </p>
              <div className="ltr mt-5 leading-none">
                <div className="text-[44px] font-extrabold tracking-[0.01em]">QBL</div>
                <div className="mt-3 text-xl font-semibold text-ink-700">
                  Refrigerated last-mile
                </div>
                <div className="mt-4 text-[34px] font-bold tracking-[0.04em]">
                  +2° … +8°C
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 APPLICATION */}
        <section className="pt-20">
          <Eyebrow>٠٥ — التطبيق</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            النظام في موضعه
          </h2>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div
              className="relative overflow-hidden rounded-[22px] p-10 text-white"
              style={{
                background:
                  "radial-gradient(120% 120% at 85% -10%, rgba(0,167,182,.22), transparent 55%), linear-gradient(150deg, #0B1730 0%, #0D1B3A 55%, #12264a 100%)",
              }}
            >
              <div className="thermal-bg" />
              <div className="relative">
                <Eyebrow onDark>مبرّد · مضبوط · قدّام بابك</Eyebrow>
                <h3 className="mt-4 text-3xl font-extrabold leading-[1.15]">
                  توصيل مبرّد يحافظ على الجودة حتى آخر متر
                </h3>
                <div className="mt-6">
                  <ThermalRule onDark />
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <span className="rounded-[10px] bg-white px-5 py-3 text-sm font-bold text-ink">
                    اطلب عرض تشغيل
                  </span>
                  <span className="rounded-[10px] border border-white/30 px-5 py-3 text-sm font-bold text-white">
                    تواصل معنا
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 rounded-[18px] border border-muted bg-white p-7">
              <div className="flex items-center gap-2.5">
                <span
                  className="block h-2.5 w-2.5 rounded-full bg-teal"
                  style={{ boxShadow: "0 0 0 4px rgba(0,167,182,.16)" }}
                />
                <span className="text-[15px] font-bold">
                  ضمن النطاق <span className="ltr">+4°</span>
                </span>
              </div>
              <div className="h-px bg-muted" />
              <div className="flex items-center gap-2.5">
                <span
                  className="block h-2.5 w-2.5 rounded-full bg-amber"
                  style={{ boxShadow: "0 0 0 4px rgba(244,168,46,.18)" }}
                />
                <span className="text-[15px] font-bold text-ink-700">
                  خارج النطاق — استخدام نادر
                </span>
              </div>
              <p className="m-0 text-[13px] leading-7 text-slatebrand">
                الكهرماني محجوز لإشارات التنبيه فقط، فلا يتنافس مع التركوازي على الهوية.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-muted pt-10 text-[13px] text-slatebrand">
          <span>© 2026 شركة قدّام بابك للخدمات اللوجستية</span>
          <span className="ltr font-semibold tracking-[0.2em]">
            QBL.SA · THERMAL IDENTITY v2
          </span>
        </footer>
      </div>
    </main>
  );
}

function Swatch({
  name,
  hex,
  bg,
  inkText = false,
  bordered = false,
}: {
  name: string;
  hex: string;
  bg: string;
  inkText?: boolean;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex h-[116px] items-end rounded-[14px] p-3.5 ${
        bordered ? "border border-muted" : ""
      }`}
      style={{ background: bg, color: inkText ? "#0D1B3A" : "#fff" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-bold">{name}</span>
        <span className="ltr text-[13px] font-semibold tracking-[0.04em] opacity-90">
          {hex}
        </span>
      </div>
    </div>
  );
}
