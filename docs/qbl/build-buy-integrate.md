# سجل قرارات Build / Buy / Integrate

آخر تحديث: 2026-08-16
لا توجد قرارات شراء نهائية قبل اكتمال فحص LogesTechs.

| Capability | Current QBL position | Decision | Priority | Rationale | Revisit trigger |
|---|---|---|---|---|---|
| Route optimization core | موجود في QBL Optimizer | USE EXISTING + EXTEND | P0 | OR-Tools وقيود متعددة وبوابة جاهزية مثبتة | فشل اختبار Production أو متطلبات جديدة |
| Traffic-aware routing | غير موجود | INTEGRATE | P1 | مزود matrix/traffic أفضل من بناء بيانات المرور | مفتاح إنتاجي وتكلفة مقبولة |
| Volume capacity | جزئي | EXTEND | P1 | الحقل موجود لكن القيد غير مثبت في solver | قبل الاعتماد التشغيلي الكامل |
| National Address | Adapter فقط | INTEGRATE | P1 | يتطلب مزود SPL مخولًا | اعتماد SPL وبيئة اختبار |
| Fleet readiness/handover | موجود داخليًا | USE EXISTING | P0 | Workflow وقاعدة بيانات Fail-closed | إذا أثبت LogesTechs تغطية مكافئة كاملة |
| Fleet maintenance | موجود داخليًا | USE EXISTING / EXTEND | P1 | سجلات صيانة وأعطال وحوادث موجودة | احتياج تنبيهات أو مخزون قطع |
| Shipment lifecycle | مثبت بقوة في واجهات LogesTechs | USE EXISTING | P0 | منع بناء TMS مكرر | تغير العقد أو فشل UAT |
| POD | غير مؤكد | VERIFY | P0 | لا شراء قبل فحص Driver App | اكتمال audit |
| COD reconciliation | واجهات قوية في LogesTechs | USE EXISTING + UAT | P0 | لا يُبنى دفتر COD مكرر؛ يلزم تحقق مالي End-to-End | فشل المطابقة أو غياب API |
| Scan-to-load | غير مثبت | VERIFY ثم INTEGRATE/BUILD | P1 | QBL لديه location codes لكن ليس scanning workflow مثبتًا | فحص Barcode/Warehouse في LogesTechs |
| SMS Messaging | محرك 22 حدثًا موجود وغير مفعّل ظاهرًا | CONFIGURE + TEST | P1 | أقرب وأقل تكلفة من بناء خدمة موازية | اعتماد مزود وتجربة آمنة |
| WhatsApp Messaging | غير مؤكد | VERIFY ثم INTEGRATE | P2 | لا يُفترض من وجود SMS | ظهور provider/config/logs |
| Route optimization in LogesTechs | زر مسار تلقائي بلا دليل خوارزمي | IGNORE FOR CORE / VERIFY ONLY | P0 | QBL Optimizer أعمق ومثبت في الشفرة | Benchmark يثبت قيودًا ومخرجات مكافئة |
| Public tracking | صفحة QBL ليست Tracking engine كاملًا | INTEGRATE | P1 | يجب استهلاك حالة Source of Truth | إثبات Tracking API في LogesTechs |
| LogesTechs shipment creation/status | API v2 موثقة جزئيًا | INTEGRATE AFTER SANDBOX | P0 | إنشاء وحالة مفردة ممكنان، مع حساب تكامل مخصص | Sandbox credentials واختبار Contract |
| LogesTechs assignment write-back | غير موثق | BLOCK / REQUEST API | P0 | لا يجوز الاعتماد على UI automation لكتابة تعيينات إنتاجية | Bulk assignment endpoint موثق |
| Webhook security | توقيع غير موثق | EXTEND GATEWAY + REQUEST HMAC | P0 | حماية من التزوير والتكرار قبل Production | توقيع رسمي أو ضابط بديل معتمد |

## نموذج التقييم لكل قرار لاحق

يُسجل لكل Gap: الأثر التشغيلي، أثر العميل، الأثر المالي، قيمة الأتمتة، جهد التنفيذ، تعقيد التكامل، توفر البيانات، مخاطر الأمن، واعتماد المورد. القرار المسموح: `USE EXISTING` أو `CONFIGURE` أو `EXTEND` أو `INTEGRATE` أو `BUILD` أو `BUY` أو `IGNORE`.
