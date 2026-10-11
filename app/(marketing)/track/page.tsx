import type { Metadata } from "next";
import { TrackForm } from "@/components/tracking/track-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "تتبع شحنتك | QBL",
  description: "أدخل رقم الشحنة وآخر 4 أرقام من الجوال المسجل على الطلب لمعرفة حالة شحنتك داخل الرياض.",
  path: "/track",
});

/**
 * صفحة التتبع العامة — مكوّن خادم يقرأ رقم الشحنة من ?code= (القادم من حقل
 * الصفحة الرئيسية) ويمرّره مُعبّأً للنموذج، بلا الحاجة إلى useSearchParams
 * التي كانت تُجبر الصفحة على التصيير من جهة العميل وتُفقدها الـSSR والعنوان h1.
 */
export default async function TrackEntryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.code;
  const initialCode = (typeof raw === "string" ? raw : "").trim().slice(0, 64);
  return <TrackForm initialCode={initialCode} />;
}
