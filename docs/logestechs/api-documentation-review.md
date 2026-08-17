# مراجعة وثائق LogesTechs API وWebhooks

آخر تحديث: 2026-08-17
الحالة: وثائق رسمية مستلمة، وحساب عميل مخصص للتكامل أُنشئ، وضُبطت أسراره في Vercel Preview، ونجح اختبار قراءة المدن عبر API بحالة HTTP 200.

## الحكم المباشر

🟡 التكامل متاح جزئيًا - الوثائق تكفي لإنشاء الشحنة وإلغائها وطباعة AWB وقراءة حالة شحنة مفردة واستقبال Webhooks للحالات، لكنها لا تكفي بعد لتدفق QBL الكامل الخاص بسحب الشحنات اليومية وتوزيعها على السائقين والمركبات ثم إعادة التعيينات.

## الاتصال والمصادقة

- Base URL موثق: `https://apisv2.logestechs.com/api`.
- الترويسة المطلوبة: `company-id`، والقيمة الخاصة بـQBL تُحفظ كمتغير بيئة ولا تُثبت في الشفرة أو Git.
- إنشاء الشحنة وإلغاؤها يستخدمان بريد حساب العميل وكلمة مروره داخل Request Body.
- لا يوجد في الوثيقة API Key أو OAuth أو Access Token أو Scope model.
- لا تُحفظ كلمة المرور في Markdown أو Excel أو Git أو Logs.

## الواجهات الموثقة

| العملية | Method | Endpoint | التقييم |
|---|---|---|---|
| إنشاء شحنة | POST | `/ship/request/by-email` | موثق؛ يحتاج حساب عميل و`company-id` |
| المدن | GET | `/addresses/cities` | موثق، مع `returnAll=true` والبحث |
| إلغاء شحنة | PUT | `/guests/{companyId}/packages/{barcode}/cancel` | موثق؛ عملية Write حساسة |
| طباعة AWB | POST | `/guests/{companyId}/packages/pdf` | موثق لمجموعة Barcodes |
| حالة شحنة | GET | `/guests/packages/status` | موثق لشحنة مفردة بواسطة Barcode أو ID |

## بيانات إنشاء الشحنة

تشمل الوثيقة: COD، مرجع الطلب، المرسل والمستلم، الهواتف، الكمية، نوع الطرد، الوزن والأبعاد، نوع الخدمة، نوع المركبة، نوع الشحنة، المدينة، الإحداثيات، مبالغ SWAP/BRING، القيمة المعلنة، عنوان المصدر والوجهة، ومعرف العنوان الوطني.

وجود `nationalAddress` وLatitude/Longitude يعني قبول الحقول ونقلها، ولا يثبت التحقق من صحتها أو Geocoding.

## Webhooks الموثقة

- Last-mile status updates عبر دورة الشحنة.
- Fulfillment updates للحالات `CREATED` و`PICKED` و`PACKED`.
- Payload last-mile يتضمن Package ID وBarcode والحالة وCOD وInvoice reference والوقت والملاحظات وتاريخ التأجيل، وقد يتضمن بيانات سائق وروابط مرفقات.
- حالات موثقة تشمل التعيين والقبول والتحميل والخروج للتسليم والفشل والتأجيل والتسليم والمرتجع والتبديل والتسليم الجزئي والتلف والفقد والنقل للطرف الثالث والفرز على الرفوف.

## فجوات حرجة في الوثائق

| الفجوة | الأثر | المطلوب من LogesTechs |
|---|---|---|
| لا API لسحب قائمة الشحنات اليومية | يمنع Batch optimization الآلي | Endpoint مع filters، pagination وupdated-since |
| لا API مفصل لجلب شحنة كاملة | قد تنقص العناوين/الإحداثيات عند التخطيط | Shipment details endpoint وresponse schema |
| لا Drivers/Vehicles APIs | يمنع Mapping موثوق | List/details مع Stable IDs وحالة التوفر والسعة |
| لا Assignment API | يمنع إعادة الخطة المعتمدة إلى LogesTechs | Bulk assign driver/vehicle/sequence مع idempotency |
| لا Webhook signature | خطر قبول أحداث مزورة | HMAC signature، timestamp وreplay window |
| لا Rate limits أو Retry policy | خطر throttling والتكرار | حدود الطلبات، 429، backoff وRetry-After |
| لا Idempotency contract | خطر إنشاء أو تعيين مكرر | Idempotency-Key أو external reference uniqueness |
| لا Error model | صعوبة المعالجة الآلية | HTTP codes وmachine-readable error schema |
| لا Sandbox موثق | يمنع اختبار Writes بأمان | Test tenant وtest credentials وreset policy |
| لا Webhook delivery policy | فقد/تكرار/اختلال ترتيب الأحداث | retries، timeout، event ID، ordering وDLQ policy |

## سياسة حساب التكامل

1. تم إنشاء حساب عميل مخصص للتكامل، وليس استخدام حساب بشري قائم.
2. بريد مخصص للتكامل وكلمة مرور عشوائية فريدة محفوظة في Secret Manager أو Vercel environment variables فقط.
3. أقل صلاحيات ممكنة وعدم ربط الحساب بمحفظة أو تسوية مالية غير لازمة.
4. مشاركة السر مع جهة LogesTechs عبر قناة آمنة منفصلة، لا داخل البريد أو Git.
5. تدوير كلمة المرور بعد الإعداد الأولي وعند مغادرة أي مسؤول تقني.
6. إضافة Monitoring وredaction بحيث لا تظهر كلمة المرور أو PII في Logs.

## قرار Architecture الحالي

- `CONNECTIVITY / CITIES READ`: تم إثبات الاتصال الفعلي بتاريخ 2026-08-17 عبر `GET /addresses/cities?returnAll=true` وحالة HTTP 200، دون إرسال بيانات دخول أو PII.
- `CREATE SHIPMENT`: حساب التكامل جاهز؛ يبقى اختبار Sandbox أو موافقة صريحة على إنشاء شحنة اختبارية.
- `READ DAILY SHIPMENTS`: غير متاح في الوثائق الحالية.
- `OPTIMIZE IN QBL`: متاح داخليًا.
- `SYNC ASSIGNMENTS`: غير متاح في الوثائق الحالية.
- `RECEIVE STATUS UPDATES`: متاح جزئيًا عبر Webhooks، بعد إضافة signature/replay protection أو ضابط بديل معتمد.
- `COD EVENTS`: قيمة COD والحالات تظهر في Payload، لكن عقد التحصيل والتسوية التفصيلي غير موثق.

القرار: `INTEGRATE PARTIALLY` الآن، و`BLOCK PRODUCTION WRITE-BACK` حتى وصول Sandbox وAssignment APIs وضوابط المصادقة والتوقيع.
