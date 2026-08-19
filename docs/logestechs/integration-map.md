# خريطة تكامل LogesTechs مع أنظمة QBL

آخر تحديث: 2026-08-19
الحالة: نجح تكامل القراءة، واعتمد المورد استقبال Status Webhooks في البيئة نفسها عبر POST وترويسة `X-API-Key`. لا يزال التكامل لا يغطي سحب الشحنات اليومية أو مزامنة التعيينات.

## حالة التواصل مع المورد

- وصل رد جزئي بوثيقتي API وWebhook، وتم إنشاء حساب عميل مخصص للتكامل بنجاح.
- الحالة: `INTEGRATION ACCOUNT CREATED - READ-ONLY API PROBE PASSED`.
- حُفظت بيانات الحساب كمتغيرات Vercel حساسة ضمن Preview وProduction، ولم تُثبت في Git. نجح اختبار `GET /addresses/cities?returnAll=true` بحالة HTTP 200.
- أضيف مسار إداري محمي في QBL: `GET /api/admin/integrations/logestechs/health` لفحص الإعداد والاتصال دون كشف الأسرار أو إعادة بيانات المدن.
- أضيف فحص إداري يدوي للطلبات المحددة عبر `POST /api/admin/integrations/logestechs/package-status`. الفحص يقرأ حالة كل Barcode على دفعات محدودة ويعرض المقارنة فقط، ولا يغيّر حالة الطلب المحلية.
- أضيف مستقبل حالة وارد `POST /api/webhooks/logestechs/status` بمصادقة `X-API-Key`، ومنع تكرار حتمي، وبوابة تمنع إعادة الطلب من حالة نهائية إلى حالة أقدم.
- أكد المورد أن الإرسال يتم في البيئة نفسها، ولا توجد إعادة محاولة تلقائية؛ عند الفشل يلزم طلب إعادة إرسال يدويًا، لذلك يبقى فحص القراءة وسيلة مصالحة احتياطية.

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
| Webhook configuration | تأكيد المورد ووثيقة Status Webhooks | POST مع `X-API-Key` معتمد؛ الرابط والسر يسجلان في إعدادات التشغيل فقط |
| Webhook execution logs | سجل Webhooks متعدد الصفحات | الأحداث والـPayload/Response والحالة مسجلة؛ سياسة Retry والتوقيع غير معروفة |
| SMS event engine | 22 حدثًا وقوالب | موجود لكنه غير مفعّل ظاهرًا؛ ليس قناة مزامنة أنظمة |
| REST API | وثيقة API v2 | إنشاء/إلغاء/AWB/حالة مفردة/مدن فقط؛ لا Shipment list أو Driver/Vehicle/Assignment APIs |

## نموذج المصادقة المرصود

- Header: `company-id`، وقيمته الفعلية تحفظ كسر في إعداد البيئة رغم أنها ليست بديلًا للمصادقة.
- Credential: بريد وكلمة مرور حساب العميل داخل جسم بعض الطلبات.
- المصادقة الواردة للWebhook: ترويسة `X-API-Key` بسر مشترك مستقل ومحفوظ على الخادم فقط.
- لا يوجد HMAC أو توقيع لكل رسالة؛ التصنيف الأمني: 🟡 مقبول بعد استخدام سر قوي وتدويره، مع بقاء حماية إعادة الإرسال معتمدة على منع التكرار داخل QBL.

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

## ضوابط الأمان المطبقة في QBL

آخر تحقق: 2026-08-19

- جميع مسارات LogesTechs الإدارية محمية بجلسة موقعة ومقصورة على `ADMIN` و`OPS_MANAGER`؛ مسار Webhook الوارد مستقل ومحمِي بالسر المشترك.
- التكامل الصادر الحالي `READ-ONLY`؛ لا توجد واجهة إنشاء أو إلغاء أو تعيين. استقبال تحديث الحالة فقط مسموح عبر Webhook موثق.
- مستقبل Webhook يرفض غياب السر أو ضعفه، ويقبل JSON محدودًا إلى 32KB، ويطبق معدلًا وحدًا للتزامن، ولا يخزن الرسالة الخام أو بيانات السائق والهاتف والمرفقات.
- معرّف حدث حتمي يمنع التكرار، والحالات غير المعروفة أو القديمة تسجل دون تعديل الطلب، والحالات النهائية لا تتراجع.
- عنوان الخدمة مثبت في Production على `apisv2.logestechs.com` عبر HTTPS فقط، مع رفض Credentials داخل URL والمنافذ والتحويلات الخارجية والاستعلامات المضمنة.
- طلبات فحص الحالة تقبل JSON محدود الحجم من نفس الموقع فقط، مع علامة طلب خاصة، Barcodes منضبطة، حالات محلية معروفة وحد أقصى 20 شحنة.
- فحص الاتصال والحالات يطبقان Rate limit وحدًا للتزامن لكل مستخدم إداري.
- استجابات المورد تقرأ بحد أقصى 2MB، ويُرفض النوع غير JSON والنصوص غير المنضبطة والأرقام السالبة.
- مهلة كل طلب خارجي محدودة، ولا تُتبع Redirects، ولا تُرسل Cookies أو البريد أو كلمة المرور في عمليات القراءة.
- جميع ردود واجهات التكامل `no-store` وتحمل ترويسات منع التخزين والتضمين وMIME sniffing.
- لا تُسجل الأسرار أو Payloads المحتوية على PII في الشفرة أو تقارير الفحص.

المخاطر المتبقية: الكتابة إلى LogesTechs والمزامنة المالية تظلان معطلتين حتى توفير واجهات Assignment رسمية. لا يوفر المورد Retry تلقائيًا أو HMAC؛ عولج ذلك جزئيًا بمنع التكرار وفحص القراءة، لكن يلزم مراقبة وطلب إعادة الإرسال يدويًا عند الفشل.

## ما يجب إثباته في LogesTechs

- API لجلب قائمة الشحنات وتفاصيلها وتحديث التعيينات؛ إنشاء الشحنة فقط موثق حاليًا.
- Driver وVehicle IDs الثابتة.
- Status IDs وtransition rules.
- سياسة تدوير سر Webhook وآلية إشعار QBL عند فشل الإرسال؛ المورد أكد عدم وجود Retry تلقائي.
- COD endpoints والأحداث.
- Import template وقواعد رفض/تحديث السجلات.
- Integration logs وSandbox أو بيئة اختبار.
