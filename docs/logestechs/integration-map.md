# خريطة تكامل LogesTechs مع أنظمة QBL

آخر تحديث: 2026-08-17
الحالة: وصلت وثائق رسمية لـAPI v2 وStatus Webhooks، ونجح فحص قراءة المدن؛ التكامل الممكن حاليًا جزئي ولا يغطي سحب الشحنات اليومية أو مزامنة التعيينات.

## حالة التواصل مع المورد

- وصل رد جزئي بوثيقتي API وWebhook، وتم إنشاء حساب عميل مخصص للتكامل بنجاح.
- الحالة: `INTEGRATION ACCOUNT CREATED - READ-ONLY API PROBE PASSED`.
- حُفظت بيانات الحساب كمتغيرات Vercel حساسة ضمن Preview فقط، ولم تُثبت في Git. نجح اختبار `GET /addresses/cities?returnAll=true` بحالة HTTP 200.
- أضيف مسار إداري محمي في QBL: `GET /api/admin/integrations/logestechs/health` لفحص الإعداد والاتصال دون كشف الأسرار أو إعادة بيانات المدن.

عند وصول الرد، يجب حفظ الوثائق دون Credentials، ثم التحقق من: بيئة الـSandbox، Base URL، إصدار API، Pagination، Stable IDs، Status dictionary، Webhook event IDs، Idempotency، Timestamp ordering، Error model وData retention.

## التدفق المستهدف

```text
LogesTechs Shipment System of Record
  -> API أو Excel export
QBL Route Optimizer
  -> Location validation
  -> Duplicate detection
  -> Optimization
  -> READY / LOCKED / VOID
  -> Vehicle + Driver + Rack/Shelf + Loading plan
LogesTechs assignment / Driver App
  -> Status updates / POD / COD
  -> Webhook أو polling
LogesTechs + QBL reporting
```

## عقود البيانات المطلوبة

| Domain | Required stable key | Owner candidate | Verification status |
|---|---|---|---|
| Shipment | Shipment/Tracking ID | LogesTechs | 🟢 حقل تشغيلي ظاهر؛ ثباته كـAPI key يحتاج تحقق |
| Optimization run | Run ID | QBL Optimizer | مثبت في الشفرة |
| Route assignment | Run ID + Shipment ID + Driver ID | QBL Optimizer حتى الاعتماد | يحتاج تكامل |
| Driver | External Driver ID mapping | LogesTechs | 🟡 تقرير يعرض Driver ID؛ عقد التكامل غير مثبت |
| Vehicle | External Vehicle ID mapping | QBL Fleet | سجل LogesTechs ظاهر ويحتاج Mapping رسمي |
| Shipment status | Status ID + event time | LogesTechs | 🟡 الحالة وتاريخها ظاهران؛ ID/transition contract غير مثبت |
| Vehicle readiness | Vehicle ID + readiness check | QBL Fleet | مثبت داخليًا |
| COD | Shipment ID + amount + custody event | LogesTechs | 🟢 واجهات العهدة والاستلام والفواتير؛ API غير مثبت |

## قنوات التكامل المرصودة

| Channel | Evidence | Current conclusion |
|---|---|---|
| Excel import/export | إدارة الطرود وتقارير متعددة | صالح كجسر مرحلي، لكن يلزم قالب، Validation وIdempotency |
| Webhook configuration | إعدادات الشركة > Webhooks | إنشاء Webhook متاح؛ لا تسجل Endpoint أو Secret في المستودع |
| Webhook execution logs | سجل Webhooks متعدد الصفحات | الأحداث والـPayload/Response والحالة مسجلة؛ سياسة Retry والتوقيع غير معروفة |
| SMS event engine | 22 حدثًا وقوالب | موجود لكنه غير مفعّل ظاهرًا؛ ليس قناة مزامنة أنظمة |
| REST API | وثيقة API v2 | إنشاء/إلغاء/AWB/حالة مفردة/مدن فقط؛ لا Shipment list أو Driver/Vehicle/Assignment APIs |

## نموذج المصادقة المرصود

- Header: `company-id`، وقيمته الفعلية تحفظ كسر في إعداد البيئة رغم أنها ليست بديلًا للمصادقة.
- Credential: بريد وكلمة مرور حساب العميل داخل جسم بعض الطلبات.
- لا API Key/OAuth/Scopes موثقة.
- التصنيف الأمني: 🟠 مقبول مبدئيًا للاختبار المقيد، غير مفضل لتكامل إنتاجي طويل الأجل دون حساب مخصص وتدوير وRedaction.

## مخاطر التكامل

| الخطر | الأثر | الضابط المقترح |
|---|---|---|
| Duplicate records | تكرار شحنة أو تحميل | Idempotency key من Shipment ID + source version |
| Dual source of truth | تعيينان أو حالتان متعارضتان | Owner واحد لكل Domain وحظر الكتابة المتبادلة |
| Stale data | خطة على حالة قديمة | Version/updated_at precondition قبل الاعتماد |
| Retry duplication | تكرار Webhook أو assignment | Idempotent consumer وevent ID |
| Event ordering | Delivered قبل Out for delivery | Sequence أو timestamp validation |
| Driver reassignment | خطة قديمة على سائق جديد | Assignment version وربط Run ID |
| Route edit after READY | اختلاف التحميل عن الجولة | قفل الخطة أو إصدار Run جديد |
| COD mismatch | تسوية مالية خاطئة | Amount immutable after dispatch + reconciliation ledger |
| API outage | توقف التخطيط أو الحالات | Queue، retry محدود، dead-letter، monitoring |
| PII leakage | مخاطر خصوصية | أقل حقول لازمة، masking، logs بلا PII |

## ما يجب إثباته في LogesTechs

- API لجلب قائمة الشحنات وتفاصيلها وتحديث التعيينات؛ إنشاء الشحنة فقط موثق حاليًا.
- Driver وVehicle IDs الثابتة.
- Status IDs وtransition rules.
- Webhook signing، retry، event IDs وIdempotency؛ السجل وحده لا يثبت هذه الضوابط.
- COD endpoints والأحداث.
- Import template وقواعد رفض/تحديث السجلات.
- Integration logs وSandbox أو بيئة اختبار.
