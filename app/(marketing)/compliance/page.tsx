import { ContentPage } from "@/components/marketing/content-page";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "سجلات حرارة وتدقيق تدعم الامتثال: توصيل مبرّد بالرياض",
  description:
    "ما يوثّقه تشغيل التوصيل المبرّد في الرياض: سجل حرارة لكل طلب، سجل تدقيق، إثبات تسليم بكود استلام، وصلاحيات محددة. لفرق الجودة — تواصل مع فريق التشغيل.",
  path: "/compliance",
});

export default function CompliancePage() {
  return (
    <ContentPage
      eyebrow="السلامة والامتثال"
      title="تشغيل منظم يراعي سلامة المنتج ومتطلبات الشركاء"
      description="لا ندّعي شهادات غير مذكورة؛ المنصة مصممة لدعم الالتزام التشغيلي بإرشادات SFDA و HACCP كمرجع عمل قابل للتوثيق."
      items={[
        { title: "سجل حرارة", description: "ربط قراءات الحرارة بالطلب والمركبة مع حالات Normal / Warning / Critical." },
        { title: "سجل تدقيق Audit Log", description: "توثيق تغييرات الحالة، إعادة الإسناد، محاولات OTP، وأي تجاوز يدوي مع السبب." },
        { title: "إثبات تسليم POD", description: "كود استلام، وتوقيع أو صورة اختيارية عند الحاجة." },
        { title: "تقليل كشف البيانات", description: "رابط العميل يعرض بيانات الطلب المرتبط فقط دون بيانات داخلية حساسة." },
        { title: "صلاحيات تشغيل", description: "أدوار واضحة للمدير، الموزع، المندوب، والعميل." },
        { title: "قابلية المراجعة", description: "نموذج بيانات يسمح بإعداد تقارير امتثال وتشغيل لاحقًا." },
      ]}
    />
  );
}
