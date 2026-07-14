"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, RotateCcw, ShieldCheck, Snowflake, Thermometer } from "lucide-react";
import { SITE } from "@/lib/site";

type StorageInstruction = "ambient" | "range" | "refrigerated";
type ExposureRisk = "standard" | "high";

const levels = {
  heatProtected: {
    name: "Heat Protected",
    title: "حماية من الحرارة",
    description: "حماية من الشمس وحرارة المركبة مع تجهيز عازل ومسار تشغيلي مناسب.",
    Icon: ShieldCheck,
  },
  temperatureControlled: {
    name: "Temperature Controlled",
    title: "درجة حرارة محكومة",
    description: "عزل وتحكم تشغيلي أعلى، مع توثيق القراءات عندما يتضمنه نطاق الخدمة.",
    Icon: Thermometer,
  },
  refrigerated: {
    name: "Refrigerated Delivery",
    title: "توصيل مبرد",
    description: "للمنتجات التي تحدد الشركة المصنّعة حفظها مبردة أو ضمن نطاق محدد يستلزم التبريد.",
    Icon: Snowflake,
  },
} as const;

function track(event: string, params: Record<string, string>) {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as typeof window & {
    gtag?: (command: "event", eventName: string, parameters: Record<string, string>) => void;
  };
  analyticsWindow.gtag?.("event", event, params);
}

export function ProtectionLevelSelector({ compact = false }: { compact?: boolean }) {
  const [storage, setStorage] = useState<StorageInstruction | null>(null);
  const [risk, setRisk] = useState<ExposureRisk | null>(null);

  const result = useMemo(() => {
    if (!storage || !risk) return null;
    if (storage === "refrigerated") return levels.refrigerated;
    if (storage === "range" || risk === "high") return levels.temperatureControlled;
    return levels.heatProtected;
  }, [risk, storage]);

  function selectRisk(value: ExposureRisk) {
    setRisk(value);
    if (!storage) return;
    const level = storage === "refrigerated"
      ? levels.refrigerated
      : storage === "range" || value === "high"
        ? levels.temperatureControlled
        : levels.heatProtected;
    track("selector_result", { level: level.name });
  }

  const whatsappHref = result
    ? `https://wa.me/${SITE.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `السلام عليكم، استخدمت أداة QBL وظهر لي مستوى ${result.name} (${result.title}). أرغب بمراجعة منتجاتنا وبدء تجربة Beauty Shield.`
      )}`
    : "#";

  return (
    <section className={`font-cairo ${compact ? "rounded-xl border border-line bg-white p-6" : "rounded-xl border border-accent/25 bg-frost-50 p-6 sm:p-8"}`}>
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-accent">أداة تحديد مستوى الحماية</p>
        <h2 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">ما المستوى الأنسب لمنتجك؟</h2>
        <p className="mt-3 leading-7 text-slatebrand">
          نتيجة أولية وليست اعتمادًا فنيًا. القرار النهائي يبدأ دائمًا من تعليمات الحفظ المكتوبة من الشركة المصنّعة.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-extrabold text-primary">١. ماذا تقول تعليمات الحفظ؟</legend>
          <div className="mt-3 grid gap-2">
            {[
              ["ambient", "حفظ في درجة حرارة الغرفة وبعيدًا عن الحرارة"],
              ["range", "نطاق حراري محدد على العبوة"],
              ["refrigerated", "يحفظ مبردًا"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStorage(value as StorageInstruction);
                  setRisk(null);
                }}
                className={`rounded-lg border p-3 text-right text-sm font-semibold transition ${
                  storage === value ? "border-accent bg-accent/10 text-primary" : "border-line bg-white text-slatebrand hover:border-accent/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={!storage ? "pointer-events-none opacity-45" : ""}>
          <legend className="text-sm font-extrabold text-primary">٢. ما مستوى تعرض الشحنة؟</legend>
          <div className="mt-3 grid gap-2">
            {[
              ["standard", "استلام وتسليم مباشر ضمن مسار منظم"],
              ["high", "توقفات متعددة أو منتج نشط/مرتفع القيمة"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => selectRisk(value as ExposureRisk)}
                className={`rounded-lg border p-3 text-right text-sm font-semibold transition ${
                  risk === value ? "border-accent bg-accent/10 text-primary" : "border-line bg-white text-slatebrand hover:border-accent/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {result && (
        <div className="mt-7 rounded-xl bg-primary p-6 text-white" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <result.Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">المستوى المقترح</p>
              <h3 className="mt-1 text-2xl font-extrabold">{result.title}</h3>
              <p className="font-latin text-sm text-white/65">{result.name}</p>
              <p className="mt-3 max-w-2xl leading-7 text-white/75">{result.description}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("selector_whatsapp_click", { level: result.name })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-primary hover:bg-accent-light"
            >
              راجع النتيجة معنا
              <MessageCircle className="h-4 w-4" />
            </a>
            <Link href="/trial" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-sm font-bold text-white hover:bg-white/10">
              ابدأ تجربة Beauty Shield
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setStorage(null);
                setRisk(null);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-white/70 hover:text-white"
            >
              إعادة الاختيار
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
