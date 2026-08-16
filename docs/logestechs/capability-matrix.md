# مصفوفة قدرات LogesTechs وأنظمة QBL

آخر تحديث: 2026-08-16
وضع التدقيق: قراءة فقط
حالة فحص LogesTechs: جلسة إنتاج مصادقة فُحصت بوضع القراءة فقط؛ النتائج أدناه مبنية على أدلة واجهة مباشرة، ولا تعني اختبار عمليات الكتابة End-to-End.

## مفتاح التصنيف

- ✅ موجودة بالكامل.
- 🟢 موجودة بدرجة قوية.
- 🟡 موجودة جزئيًا.
- 🟠 محدودة أو تحتاج تكاملًا.
- 🔴 غير موجودة بعد بحث كافٍ.
- ⚪ غير مؤكدة وتحتاج فحصًا إضافيًا.

## المصفوفة الحالية

| Capability | LogesTechs | Coverage | Location | Evidence | Missing / verification required | QBL System | Confidence |
|---|---|---:|---|---|---|---|---|
| إدارة الشحنات ودورة حياتها | 🟢 موجودة بقوة | 85% | إدارة الطرود | LT-E-003 | لم تُختبر عملية إنشاء أو انتقال حالة حقيقية؛ SLA متعدد القطع يحتاج تحققًا | LogesTechs هو Source of Truth المقترح | مرتفع للواجهة / متوسط للسلوك |
| تتبع الشحنات | 🟡 موجودة جزئيًا | 55% | Dashboard search + إدارة الطرود | LT-E-002، LT-E-003 | لم تُثبت بوابة عميل عامة أو ETA حي أو سجل حالات كامل | موقع QBL يستهلك الحالة ولا يملك Tracking engine | متوسط |
| استيراد وتصدير Excel | 🟢 موجودة بقوة | 80% | إدارة الطرود وتقارير متعددة | LT-E-003، LT-E-009 | قوالب الاستيراد، قواعد الرفض وحدود الحجم لم تُختبر | QBL Optimizer يستورد Excel ويصدر خطط التشغيل | مرتفع للواجهة / متوسط للسلوك |
| Barcode / Label / Manifest | 🟡 موجودة جزئيًا | 65% | إدارة الطرود + إعدادات الملصقات | LT-E-003 | المسح والطباعة ظاهران؛ منع الخطأ وScan-to-load لم يثبتا | QBL Optimizer يحفظ Tracking وخطة تحميل | متوسط |
| التعيين اليدوي للسائق | 🟢 موجودة بقوة | 80% | إدارة الطرود > تعيين/إعادة تعيين | LT-E-003 | لم ينفذ تغيير إنتاجي لاختبار القيود والتاريخ | QBL Optimizer يولد اقتراح التوزيع | مرتفع للواجهة / متوسط للسلوك |
| التعيين للمركبة | 🟡 موجودة جزئيًا | 55% | المركبات + الشحنات المحمولة | LT-E-004 | ربط المركبة بالرحلة والسائق والسعة لم يثبت End-to-End | QBL Fleet يملك الجاهزية والتسليم | متوسط |
| Route sequencing | 🟠 محدود / يحتاج تحقق | 30% | إدارة الطرود > المسار التلقائي / تعيين مسار السائق | LT-E-003 | وجود الإجراء فقط؛ لا دليل على خوارزمية أو مخرجات أو تحسين | QBL Optimizer: 🟢 قوي، OR-Tools مع 2-opt fallback | متوسط لوجود الواجهة / منخفض للعمق |
| Multi-driver / multi-vehicle optimization | ⚪ غير مؤكدة | — | متوقع: Automatic Routing | LT-F-001 | إثبات توليد عدة مسارات واستخدام جميع المركبات | QBL Optimizer: 🟢 قوي | منخفض لـLogesTechs / مرتفع لـQBL |
| Weight capacity | ⚪ غير مؤكدة | — | متوقع: Route / Vehicle | LT-F-001 | إثبات القيود لكل مركبة | QBL Optimizer: ✅ قيد صريح في OR-Tools | منخفض لـLogesTechs / مرتفع لـQBL |
| Volume capacity | ⚪ غير مؤكدة | — | متوقع: Route / Vehicle | LT-F-001 | إثبات تطبيق القيد، لا مجرد وجود حقل | QBL Optimizer: 🟡 الحقول والمخرجات موجودة لكن لم يُثبت Dimension للحجم | منخفض لـLogesTechs / متوسط لـQBL |
| Piece / stop capacity | ⚪ غير مؤكدة | — | متوقع: Route / Vehicle | LT-F-001 | إثبات التطبيق | QBL Optimizer: ✅ قيود Pieces وStops مستقلة | منخفض لـLogesTechs / مرتفع لـQBL |
| Time windows / driver shifts | ⚪ غير مؤكدة | — | متوقع: Route | LT-F-001 | إثبات النوافذ والمناوبات | QBL Optimizer: 🟢 مطبقة عند توافر البيانات | منخفض لـLogesTechs / مرتفع لـQBL |
| Traffic-aware routing | ⚪ غير مؤكدة | — | متوقع: Maps / Route | LT-F-001 | إثبات مصدر حركة المرور والوقت الحقيقي | QBL Optimizer: 🔴 غير موجود؛ يستخدم Haversine ومتوسط سرعة ثابت | منخفض لـLogesTechs / مرتفع لـQBL |
| Priority routing | ⚪ غير مؤكدة | — | متوقع: Route | LT-F-001 | إثبات أثر الأولوية على الحل | QBL Optimizer: 🟢 أوزان وعقوبات للأولوية | منخفض لـLogesTechs / مرتفع لـQBL |
| Geographic validation | ⚪ غير مؤكدة | — | متوقع: Addresses / Maps | LT-F-001 | إثبات الحدود والدقة والمصدر والمراجعة | QBL Optimizer: 🟢 تحقق الرياض ومصدر/ثقة ومراجعة يدوية | منخفض لـLogesTechs / مرتفع لـQBL |
| National Address validation | 🟠 حقل نقل فقط | 25% | Create Shipment API > `nationalAddress` | LT-E-012 | الوثيقة تثبت قبول المعرف، لا التحقق من SPL أو صحة العنوان | QBL Optimizer: 🟠 Adapter يحتاج إعداد SPL | مرتفع لوجود الحقل / منخفض للتحقق |
| Duplicate detection | ⚪ غير مؤكدة | — | متوقع: Import / Shipments | LT-F-001 | إثبات قواعد التكرار | QBL Optimizer: ✅ تكرار Tracking والتعيينات والعنوان | منخفض لـLogesTechs / مرتفع لـQBL |
| READY / LOCKED / VOID | ⚪ غير مؤكدة | — | متوقع: Dispatch / Run | LT-F-001 | بحث كامل عن حالات مكافئة | QBL Optimizer: ✅ بوابة Fail-closed | منخفض لـLogesTechs / مرتفع لـQBL |
| Run ID وRun Control | ⚪ غير مؤكدة | — | متوقع: Routes / Runs | LT-F-001 | إثبات معرّف ثابت وإصدارات الخطة | QBL Optimizer: 🟢 Run ID في ملفات التصدير والتحكم | منخفض لـLogesTechs / مرتفع لـQBL |
| Route locking / reoptimization | ⚪ غير مؤكدة | — | متوقع: Routes | LT-F-001 | إثبات القفل، الإصدار وإعادة التحسين | QBL Optimizer: 🟡 قفل التنزيل التشغيلي موجود؛ إصدار/إعادة تحسين غير مثبتين بالكامل | منخفض لـLogesTechs / متوسط لـQBL |
| Rack / Shelf Rxx-Sx | ⚪ غير مؤكدة | — | متوقع: Warehouse | LT-F-001 | فحص الرفوف والمواقع والمسح | QBL Optimizer: ✅ Rack لكل مركبة وShelf وLocation code | منخفض لـLogesTechs / مرتفع لـQBL |
| Reverse loading / loading sequence | ⚪ غير مؤكدة | — | متوقع: Warehouse / Loading | LT-F-001 | إثبات ترتيب تحميل تشغيلي | QBL Optimizer: ✅ ترتيب تحميل عكسي وخطة Warehouse | منخفض لـLogesTechs / مرتفع لـQBL |
| Scan-to-load / misload prevention | ⚪ غير مؤكدة | — | متوقع: Warehouse / Driver App | LT-F-001 | إثبات مسح فعلي وحظر التحميل الخاطئ | QBL Optimizer: 🟠 خطط وأكواد فقط؛ لا دليل على Workflow مسح End-to-End | منخفض |
| Driver App / GPS / live location | ⚪ غير مؤكدة | — | لم تظهر شاشة Map/App في 94 رابط تنقل | LT-E-002، LT-E-011 | قد يكون تطبيقًا منفصلًا؛ يلزم حساب السائق أو رابط التطبيق | QBL الداخلي لا يثبت تطبيق توصيل ميدانيًا كاملًا | متوسط لعدم ظهوره / منخفض للحكم النهائي |
| Proof of Delivery | ⚪ غير مؤكدة | — | متوقع: Driver App / Shipment details | LT-F-001 | OTP، صورة، توقيع، اسم مستلم، GPS ووقت | غير مثبت في أنظمة QBL الحالية | منخفض |
| Returns / Exchange / Partial delivery | 🟢 موجودة بقوة | 85% | الرواجع: استقبال/تبديل/جزئي/جلب/مع السائق/تسليم للمرسل | LT-E-005 | لم تُختبر انتقالات الحالة أو مسح المرتجع | QBL Fleet يعالج Vehicle return فقط | مرتفع للواجهة / متوسط للسلوك |
| COD / Collections / Settlement | 🟢 موجودة بقوة | 85% | استلام التحصيل + تقارير العهدة والتحصيل | LT-E-006 | المطابقة البنكية وAging والتسوية End-to-End لم تُختبر | ليس ضمن Optimizer أو Fleet | مرتفع للواجهة |
| Invoices / VAT / Pricing | 🟢 موجودة بقوة | 80% | الفواتير + التسعير + المحاسبة | LT-E-006، LT-E-009 | لا اختبار فعلي للدفع أو القيود المحاسبية | موقع QBL ليس نظام فواتير تشغيليًا | مرتفع للواجهة |
| SMS / Notifications | 🟠 موجودة وغير مفعلة ظاهرًا | 55% | الإشعارات > إعدادات SMS | LT-E-008 | 22 حدثًا وقوالب ظاهرة، لكن 0/19 مفاتيح تفعيل ظاهرة كانت مفعلة؛ الإرسال لم يُختبر | يحتاج CONFIGURE ثم اختبار مزود | مرتفع للحالة المرصودة |
| WhatsApp | ⚪ غير مؤكدة | — | لم يظهر مزود أو سجل أو إعداد WhatsApp في الفحص الحالي | LT-E-002، LT-E-008 | يلزم بحث إعداد المزود أو تكامل خارجي | غير مثبت في QBL | متوسط |
| Users / Roles / Permissions / Audit | 🟢 موجودة بقوة | 75% | المستخدمون + Access log + إعدادات الشركة | LT-E-004، LT-E-007 | دقة RBAC وMFA والجلسات لم تُختبر | QBL Fleet: 🟡 أدوار وسجل عمليات | مرتفع للواجهة / متوسط للعمق |
| Vehicle registry and availability | 🟡 موجودة جزئيًا | 60% | المركبات > أنواع/تفاصيل/شحنات محمولة | LT-E-004 | السعة والتوفر والربط التشغيلي الكامل لم تثبت | QBL Fleet: 🟢 سجل مركبات وحالات تشغيلية | مرتفع للواجهة |
| Vehicle readiness / safety inspection | ⚪ غير مؤكدة | — | متوقع: Vehicles / Inspections | LT-F-001 | فحص Checklists والبوابات | QBL Fleet: ✅ قائمة 7 عناصر مع فشل حرج وFail-closed | منخفض لـLogesTechs / مرتفع لـQBL |
| Driver handover / return | ⚪ غير مؤكدة | — | متوقع: Fleet / Drivers | LT-F-001 | فحص الصور والتوقيع والمعدات والموافقة | QBL Fleet: ✅ تسليم/استرجاع، صور، توقيع، معدات وموافقة | منخفض لـLogesTechs / مرتفع لـQBL |
| Maintenance / faults / damage | ⚪ غير مؤكدة | — | متوقع: Fleet / Maintenance | LT-F-001 | فحص الصيانة والدورات والتكاليف | QBL Fleet: 🟢 سجلات صيانة وأعطال وأضرار وحوادث | منخفض لـLogesTechs / مرتفع لـQBL |
| API / Webhooks / integration logs | 🟡 موجودة جزئيًا | 70% | API v2 docs + Webhook docs + السجل والإعدادات | LT-E-007، LT-E-012، LT-E-013 | لا shipment list/details أو drivers/vehicles/assignment؛ لا OAuth/API key/signature/rate limits/retry/idempotency موثقة | QBL Optimizer يملك API داخليًا | مرتفع للواجهات الموثقة |
| Service types / SLA configuration | 🟢 موجودة بقوة | 80% | إدارة أنواع الخدمة | LT-E-009 | السلوك الفعلي عند إنشاء الشحنة لم يُختبر | LogesTechs | مرتفع |
| Delivery attempts / driver performance | 🟢 موجودة بقوة | 80% | تقرير محاولات التوصيل + تقييم السائقين | LT-E-010 | إدخال المحاولة من تطبيق السائق لم يُختبر | LogesTechs | مرتفع للواجهة |

## قاعدة التحديث

لا تُرقّى أي Capability إلى ✅ من واجهة أو زر فقط. النتائج الحالية تثبت وجود الأسطح والبيانات والتكوينات، أما جاهزية الإنتاج والسلوك End-to-End فتحتاج اختبارًا آمنًا خارج بيانات الإنتاج أو دليل API موثقًا.
