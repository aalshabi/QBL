import { ContentPage } from "@/components/marketing/content-page";

export default function CompliancePage() {
  return (
    <ContentPage
      eyebrow="السلامة والامتثال"
      title="تشغيل منظم يراعي سلامة المنتج ومتطلبات الشركاء"
      description="لا ندّعي شهادات غير مذكورة؛ المنصة مصممة لدعم الالتزام التشغيلي بإرشادات SFDA وHACCP كمرجع عمل قابل للتوثيق."
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
