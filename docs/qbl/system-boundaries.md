# حدود ملكية الأنظمة في QBL

آخر تحديث: 2026-08-16
الحالة: اقتراح حوكمة محدّث بعد فحص LogesTechs المباشر في 2026-08-16.

| Data domain | Source of Truth المقترح | مسؤوليات النظام | أنظمة مستهلكة | خطر التعارض |
|---|---|---|---|---|
| Shipment identity/lifecycle/status | LogesTechs | إنشاء الشحنة، الحالات، تاريخ الحالة، Barcode | Optimizer، Website، Reports | متوسط؛ الواجهة مثبتة وعقد API غير مثبت |
| Customer/merchant operational account | LogesTechs | العميل، التاجر، التسعير، الرصيد | Website/CRM | متوسط |
| COD and settlement | LogesTechs | المبلغ، الحيازة، التحصيل، التسوية والفواتير | Accounting/Reports | مرتفع ماليًا رغم قوة التغطية الوظيفية |
| Location validation result | QBL Route Optimizer | الإحداثيات، المزود، الدقة، التحقق، Manual confirmation | LogesTechs assignment | متوسط |
| Optimization plan | QBL Route Optimizer | Run ID، routes، sequence، driver/vehicle proposal | LogesTechs، Warehouse | مرتفع إذا سُمح بالتعديل في نظامين |
| READY/LOCKED/VOID | QBL Route Optimizer | بوابة الجاهزية وخطة التصدير/التحميل | Warehouse، Dispatch | مرتفع |
| Rack/Shelf/loading order | QBL Route Optimizer | Rxx/Sx، loading sequence، reverse loading | Warehouse | متوسط |
| Driver master record | LogesTechs | الهوية التشغيلية وحالة التوصيل والعهدة | Fleet، Optimizer | يحتاج External ID ثابت |
| Vehicle master/safety | QBL Fleet Management | السجل، الجاهزية، الأعطال، الصيانة، التسليم | Optimizer، LogesTechs | يحتاج Vehicle ID mapping |
| Marketing content/leads | QBL Website | المحتوى وطلبات التواصل | CRM/Operations | منخفض |

## قواعد الحوكمة

1. لا يملك نظامان Authority على الحقل نفسه.
2. خطة READY لا تُعدّل؛ أي تغيير ينشئ إصدار Run جديدًا.
3. LogesTechs لا يقرر جاهزية المركبة؛ يستهلك حالة QBL Fleet.
4. QBL Optimizer لا يغير Shipment status المالي أو التشغيلي النهائي.
5. كل تكامل يملك Idempotency key وCorrelation ID ووقت حدث وإصدارًا.
6. تُحذف PII غير اللازمة قبل أي طلب خرائط أو سجل تشخيص.

## تعارضات تحتاج حسمًا بعد الفحص

- زر المسار التلقائي موجود، لكن لا دليل أنه ينافس QBL Optimizer في القيود أو الخوارزمية؛ يبقى Optimizer هو مالك الخطة.
- هل Vehicle assignment في LogesTechs يمثل مجرد ربط أم قرار جاهزية؟
- هل Driver App يسمح بتعديل الترتيب بعد READY؟
- هل Warehouse/Barcode في LogesTechs يستطيع تنفيذ Rxx/Sx وscan-to-load؟
- هل COD status مستقل عن Shipment status أم جزء منه؟ واجهات منفصلة توحي بالفصل، لكن عقد البيانات غير مثبت.
