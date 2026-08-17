# تحليل الفجوات الأولي

آخر تحديث: 2026-08-16
تنبيه: تم تدقيق واجهات الإنتاج بوضع القراءة فقط. «غير مثبت» لا يعني غيابًا، ووجود الشاشة لا يعني جاهزية End-to-End.

| Capability | Current status | Priority | Why it matters | Preliminary decision |
|---|---|---|---|---|
| LogesTechs API/Webhooks | 🟡 API v2 وStatus Webhooks موثقة جزئيًا | P0 | لا توجد واجهات موثقة لسحب الشحنات أو السائقين/المركبات أو التعيين | REQUEST MISSING ENDPOINTS ثم INTEGRATE |
| API authentication | 🟠 بريد/كلمة مرور العميل داخل الطلب | P0 | خطر تسرب السر وغياب Scopes/rotation القياسي | DEDICATED ACCOUNT + SECRET MANAGER؛ اطلب Token/OAuth |
| Webhook authenticity | 🔴 غير موثقة | P0 | يمكن قبول حدث مزور أو معاد تشغيله | اطلب HMAC signature وtimestamp/replay protection |
| Assignment write-back | ⚪ لا Endpoint في الوثيقة | P0 | الخطة ستبقى خارج LogesTechs | اطلب Bulk assignment API مع Idempotency |
| Shipment status authority | 🟢 دورة الشحنة وحقول الحالة قوية في الواجهة | P0 | يمنع Dual Source of Truth | USE LOGESTECHS مع Contract واضح |
| POD completeness | ⚪ غير مؤكدة | P0 | إثبات التسليم والنزاعات وخدمة العملاء | VERIFY قبل BUILD/BUY |
| COD reconciliation | 🟢 واجهات عهدة واستلام وفواتير قوية؛ السلوك غير مختبر | P0 | أثر مالي مباشر | USE EXISTING ثم اختبار UAT مالي |
| Traffic-aware travel matrix | 🔴 غير موجودة في QBL Optimizer | P1 | ETA ومسافة الطريق أدق من Haversine | INTEGRATE مزود خرائط |
| Volume capacity enforcement | 🟡 جزئي في QBL Optimizer | P1 | يمنع خطة لا تناسب المركبة حجميًا | EXTEND solver |
| Scan-to-load / misload prevention | 🟠 التخطيط موجود والمسح غير مثبت | P1 | يمنع التحميل الخاطئ | VERIFY LogesTechs؛ ثم INTEGRATE أو BUILD |
| Route versioning/reoptimization | 🟡 غير مثبت بالكامل | P1 | ضبط التغيير بعد READY | EXTEND |
| National Address provider | 🟠 Adapter فقط | P1 | موثوقية الموقع الوطني | INTEGRATE SPL مرخص |
| LogesTechs security depth | 🟡 مستخدمون وAccess log وأدوار ظاهرة | P1 | حماية PII والعمليات المالية | VERIFY RBAC/MFA/SESSIONS |
| SMS production readiness | 🟠 22 حدثًا لكن التفعيل الظاهر صفر | P1 | تجربة العميل وتأكيد الموقع | CONFIGURE + TEST في بيئة آمنة |
| WhatsApp production readiness | ⚪ غير مؤكدة | P2 | تجربة العميل وتأكيد الموقع | VERIFY provider/config/logs |
| Profitability analytics | 🟢 حقول وتقارير ربحية ظاهرة | P2 | قرار التسعير والعملاء | USE EXISTING ثم validate formulas |
| Advanced route optimization in LogesTechs | 🟠 زر مسار تلقائي فقط | P0 | منع الاعتماد على مسار غير مقيد بالسعة والزمن | KEEP QBL OPTIMIZER؛ لا استبدال دون Benchmark |
| Driver App / live GPS / ETA | ⚪ لم تظهر في لوحة الإدارة | P1 | الرؤية الميدانية وتجربة العميل | VERIFY المنتج المنفصل قبل BUY |

## قواعد القرار

- لا شراء قبل تفكيك Capability ومقارنتها بما هو مثبت.
- لا BUILD إذا كانت الوظيفة موجودة ويمكن تفعيلها أو تكاملها.
- لا USE EXISTING إذا كانت الشاشة موجودة دون Workflow أو دليل End-to-End.
- أي P0 غير مؤكد يبقى في قائمة الفحص الأولى بعد تسجيل الدخول.
