/**
 * بيانات منظمة — تُحقن كـ <script type="application/ld+json">.
 * القاعدة: لا يُذكر في السكيما إلا ما هو معروض على الصفحة فعلاً وموثّق في
 * lib/contact.ts و lib/site.ts. لا تقييمات ولا عدد عملاء ولا أسعار ولا اعتمادات.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // القيم ثابتة في الكود ولا تأتي من مدخل مستخدم.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
