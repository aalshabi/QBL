# مواصفة ترحيل LogesTechs admin-pro → لوحة تحكم QBL الإدارية

> **المصدر:** `admin-pro.logestechs.com/qbl-logistics` (Angular + REST API على `apisv5.logestechs.com`)
> **تاريخ الالتقاط:** 2026-07-13 — لقطات الشاشة في `docs/migration/screenshots/`
> **مبدأ الترحيل:** استخلاص الوظائف والبنية فقط — إعادة بناء كاملة بأسلوب QBL (Next.js App Router + Prisma + shadcn/ui، عربي أولًا RTL).

---

## 1. نظرة عامة على النظام المصدر

نظام إدارة لوجستي آخر ميل (Last-mile) متعدد الوحدات. الهوية: مشرف واحد (`مدير النظام`) مع صلاحيات كاملة، شريط جانبي RTL يضم ~15 وحدة رئيسية و60+ شاشة. الواجهة عربية بالكامل مع تبديل EN/AR.

**الشريط العلوي الثابت:** بحث سريع (رقم الطرد/الإرسالية/رقم المستلم) • زر «إضافة طرد» • «طلبات جديدة» • «إستعلام عن زبون» • إشعارات (عداد) • إعدادات • ملف المستخدم.

### شجرة القوائم الكاملة (كما التُقطت)

| الوحدة | الشاشات الفرعية |
|---|---|
| الملخص (Dashboard) | بطاقات حالات، خريطة سائقين حيّة، مدخولات، أعلى عوائد المتاجر |
| إدارة الطرود | جدول الطلبات الرئيسي `/home/manage-shipments` |
| المتابعات | طرود بانتظار الموافقة `/home/pending-approval` |
| إدارة الرجيع | شاشة استلام الطرود الرجيع، رواجع التبديل، رواجع التوصيل الجزئي، طرود الإحضار مع السائق، مسلّمة إلى المرسل |
| تقارير حالية | تقرير السائقين، عهدة السائقين، الفروع، الشركاء، العملاء النشطين |
| إدارة المركبات | `/home/manage-containers` |
| إدارة المستخدمين | مستخدمون `/home/manage-users/users` + عملاء/تجّار `/home/manage-users/customers` |
| الفروع | `/home/manage-branches` (Hubs) |
| الشركاء | شركاء لوجستكس، تقييم الشركاء، شبكة الشركاء، الطرود غير المستلمة من الشركاء |
| قواعد الشحن الذكية | أتمتة إسناد/توجيه |
| المحاسبة (COD) | استلام التحصيلات، المفرزة، المصدرة، المسلّمة، كشوفات التحصيل، المحملة في المركبة، المقبوضات، المتأخرة، المصروفات، ملخص مالي، حاسبة الأسعار، عروض الأسعار، تقرير الأرباح، رسوم إضافية |
| الإدارة | تقارير التحصيلات (4 أنواع)، إدارة المناطق، المستلمين، خطوط الشحن، أنواع الخدمة، طرق التحصيل، محتويات الطرد |
| تقارير تفصيلية | 15 تقريرًا (طرود العميل، مناديب المبيعات، المتأخرة، غير المسلّمة، الإيرادات، رصيد العميل، تقييم السائقين، محاولات التوصيل…) |
| تقارير إجمالية | 12 تقريرًا (حسب المدينة/العميل/السائق، أداء التسليم، المبيعات، الحالات اليومية للفرع…) |
| أرشيف | أرشيف الطرود، أرشيف التحصيلات المسلّمة |
| إعدادات الحساب | أنواع الطرود، التصنيفات، سجل Webhooks |
| إدارة الشركة | إعدادات الشركة، الإشعارات |

---

## 2. الوحدات — وصف تفصيلي

### 2.1 لوحة المؤشرات (الملخص) — `02-dashboard.png`

**الغرض:** نظرة تشغيلية لحظية لليوم.

- **بطاقات حالات علوية (KPI):** الطلبات الجديدة، بانتظار تعيين السائق، في المركبة، تم إرجاعها، مؤجلة لوقت آخر، مغلقة — وعمود جانبي: في الفرع، تم إحضارها، تم توصيلها، تم تبديلها، مصدرة إلى شريك، مصدرة إلى طرف ثالث، بانتظار التحميل، رفضها السائق.
- **فلاتر:** فرع، نوع التاريخ (تاريخ الحجز/الإنشاء)، نطاق (اليوم…).
- **خريطة حية:** «حركة السائقين وأماكن تواجدهم» — فلاتر: داخل/خارج الخدمة، فرع، مدينة الوجهة، سائق. قائمة سائقين جانبية (طرود / بدون طرود) مع نسبة إنجاز لكل سائق وزر «طباعة طرود السائق».
- **معدل المدخولات (أجور التوصيل):** رسم بياني شهري/سنوي/أسبوعي/يومي + فلتر عميل + تصدير Excel.
- **أعلى عوائد المتاجر:** قائمة مرتبة.
- **APIs مرجعية:** `dashboard/packages/v2/cards`, `dashboard/income`, `dashboard/best-income`, `tracking/drivers/latest-locations`.

### 2.2 إدارة الطرود (الطلبات) — `03-orders.png`

**الغرض:** الجدول التشغيلي المركزي لكل الشحنات.

- **أعمدة:** تحديد (checkbox + علم متابعة)، رقم الطرد (باركود)، السعر (قابل للتعديل ±)، COD، الرقم المرجعي للدفع، الزبون (المتجر)، المرسل، المستقبل (اسم + مدينة + حي)، الحالة، رابط تتبع الطرف الثالث، الإرسالية، نوع الخدمة، طريقة الدفع، طريقة التحصيل، تاريخ الحجز/التوصيل/المتوقع/آخر حالة/التأجيل، الوقت المستغرق، ملاحظات.
- **فلاتر:** بحث لكل عمود، فلتر حالة (الكل + 22 حالة)، نطاق تاريخ (قبل شهر…)، تاريخ الحجز، زبون.
- **إجراءات جماعية (شريط الأدوات):** استلام طرود من السائق، طباعة طرود السائق، قراءة بالباركود، مسار السائق التلقائي، موافقة على الطرود، تغيير الحالة، تعيين للسائق، طباعة التقرير، طباعة سند القبض، تحديد مسار السائق، استيراد/تصدير Excel.
- **تنبيهات:** شريط أصفر (تحقق من العنوان الوطني)، شريط أزرق (طرود مؤجلة لليوم).
- **API مرجعي:** `GET /admin/packages/v2?page&pageSize&fromDate&toDate&search…` + `packages/v2/count`.

### 2.3 المتابعات — `04-followups.png`
طرود «بانتظار موافقة خدمة العملاء» — نفس جدول الطرود مع فلترة مسبقة + عدّاد في القائمة الجانبية. APIs: `packages/follow-up-count`, `packages/pending-approval-count`.

### 2.4 إدارة المستخدمين + العملاء — `05-users.png`, `28-customers.png`

- **المستخدمون** (سائقون/موظفون): الاسم، البريد، الهاتف، المدينة، الفرع (hub)، الدور، الحالة (VERIFIED…)، تاريخ الإنشاء. فلاتر: فرع، بحث. `GET /admin/users?driverType=TYPICAL`.
- **العملاء (التجّار):** متاجر مرسلة — الاسم، اسم المتجر، الهاتف، المدينة، الفرع، طريقة الدفع، التصنيف، الحالة (VERIFIED)، رصيد/محفظة. فلاتر: طريقة الدفع، فرع، حالة. `GET /admin/customers?status=VERIFIED`.
- كيان العميل يحمل أعلامًا كثيرة (تسعير لكل نوع خدمة، محفظة، فوترة جماعية…) — راجع §3.

### 2.5 المناديب والأسطول — `06-vehicles.png`, `15-16` تقارير

- **المركبات:** الاسم/الموديل (Avante)، الماركة (Hyundai)، رقم اللوحة، السعة (volume)، السائق المرتبط، الفرع، عدد الطرود المحملة، انتهاء التأمين، انتهاء الرخصة. `GET /admin/containers` + `vehicle-types`.
- **تقرير السائقين:** لكل سائق — عدد الطرود بحالاتها، نسب الإنجاز، التحصيل المستلم. `reports/drivers/info/summary`.
- **تقرير عهدة السائقين:** الطرود/المبالغ في عهدة كل سائق (`isOnlyDriverCustody=true`).
- **الخريطة الحية:** مواقع لحظية `geo-services/tracking/drivers/latest-locations`.

### 2.6 الفروع والشركاء — `07-branches.png`
Hubs: اسم الفرع، العنوان، المدينة، المسؤول. الشركاء: شركات شحن خارجية مرتبطة + تقييم + طرود مصدرة للشريك.

### 2.7 المحاسبة وتحصيل COD — `09..14, 24`

**دورة حياة التحصيل (COD lifecycle):** مع السائق (عُهدة) → **استلام التحصيلات** من السائق (`accountant/customers/received-cod`) → **فرز** لكل عميل (`accountant/sorted/mass-packages`, status=`SORTED_BY_ACCOUNTANT`) → **تصدير** كشف للعميل → **تسليم** للعميل (مع/بدون إخلاء عهدة) → أرشيف.

- **استلام التحصيلات:** ملخصات (إجمالي COD، بدون أجور، عدد الطرود، المبالغ المستلمة) + جدول لكل زبون. فلتر `codFilterType=TOTAL_COD`.
- **التحصيلات المفرزة:** كشوفات جماعية (mass packages) مع مجاميع (شامل/غير شامل الضريبة).
- **المصروفات:** بنود مصروفات (سائق/فرع/شريك/أخرى) + مجاميع. `accountant/expenses`.
- **ملخص مالي:** `accountant/financial-report` — مجموع COD المسلّم، أجور التوصيل، أجور الرواجع، تكلفة الشركاء، المصروفات (سائق/فرع/شريك/أخرى)، أرباح السائقين، ضريبة (VAT)، صافي الربح، مستحق العملاء.
- **تقرير الأرباح:** `accountant/profit` — دخل (أجور، رسوم COD، تأمين، ضريبة، غرامات، تخليص) مقابل مصروف (سائق/فرع/شريك/أخرى + عهدة عملاء) + صندوق نقدي. `accountant/financial-status` — العهدة الحالية (سائق/فرع/شريك).
- **حاسبة الأسعار:** تسعير افتراضي للشركة لكل نوع خدمة + مصفوفة (مدينة مصدر × مدينة وجهة). `pricing/company-prices/by-service-type-with-default`.
- **عروض الأسعار (الفوترة):** تسعير مخصص لكل عميل `pricing/customers`.

### 2.8 التقارير والتحليلات — `15..17, 25`
ثلاث فئات: **حالية** (سائقون، عهدة، فروع، شركاء، عملاء نشطون)، **تفصيلية** (15 تقريرًا على مستوى الطرد)، **إجمالية** (12 تقريرًا مجمّعًا حسب مدينة/عميل/سائق/فترة). كلها: فلاتر (نطاق تاريخ، فرع، مدينة، عميل/سائق) + تصدير Excel + طباعة.

### 2.9 الإعدادات والبيانات المرجعية — `18..21, 27`

- **إدارة المناطق:** شجرة Region → City → Village ثلاثية المستويات (`addresses/regions/{id}/cities`, `cities/{id}/villages`).
- **أنواع الخدمة:** اسم عربي/إنجليزي، ساعات التوصيل/الالتقاط المتوقعة، لون، أنواع مركبات مرتبطة، أنواع شحنات مدعومة (`REGULAR, COD, SWAP, BRING`)، نمط إسناد الوجهة (CITY…). `admin/service-types`.
- **طرق التحصيل:** نقدًا/مدى/فيزا/ماستر… (اسم عربي + نوع + افتراضي + مخفي). `admin/payment-type`.
- **إدارة المستلمين:** دفتر عناوين المستلمين المتكررين. `admin/manage-recipients`.
- **أنواع الطرود / محتويات الطرد / التصنيفات:** قوائم مرجعية للتصنيف.
- **إعدادات الشركة:** هوية، شعار، عملة، منطقة زمنية (Asia/Riyadh)، سياسات (عنوان وطني إلزامي…).
- **الصلاحيات:** أدوار (مدير نظام، محاسب، موزّع dispatcher، خدمة عملاء، سائق، عميل) — تظهر من مسارات API (`/admin/*`, `/accountant/*`) ومن شاشة المستخدمين.

### 2.10 حالات الطرد (Status Enum المصدر — 22 حالة)

`DRAFT, PENDING_CUSTOMER_CARE_APPROVAL, APPROVED_BY_CUSTOMER_CARE_AND_WAITING_FOR_DISPATCHER, ASSIGNED_TO_DRIVER_AND_PENDING_APPROVAL, REJECTED_BY_DRIVER_AND_PENDING_MANGEMENT, ACCEPTED_BY_DRIVER_AND_PENDING_PICKUP, SCANNED_BY_DRIVER_AND_IN_CAR, OUT_FOR_DELIVERY, DELIVERED_TO_RECIPIENT, PARTIALLY_DELIVERED, POSTPONED_DELIVERY, RETURNED_BY_RECIPIENT, SWAPPED, BROUGHT, EXPORTED_TO_HUB, EXPORTED_TO_THIRD_PARTY, TRANSFERRED_OUT, SCANNED_BY_HANDLER_AND_UNLOADED, MOVED_TO_SHELF_AND_OUT_OF_HANDLER_CUSTODY, OPENED_ISSUE_AND_WAITING_FOR_MANAGEMENT, COMPLETED, CANCELLED`

---

## 3. نموذج البيانات المستنتج (من استجابات API)

### Package (الطرد) — الكيان المركزي
`id, companyId, customerId(التاجر), barcode(+صورة), invoiceNumber, description, quantity, weight, overWeight, width/length/height, cost(أجرة التوصيل), cod, codPaymentMethod, paymentType, serviceTypeId, shipmentType(REGULAR|COD|SWAP|BRING), status, senderName/Phone/Address, receiverName/Phone/Address(region/city/village), originAddressId, destinationAddressId, driverId, hubId, partnerId, thirdPartyTrackingNo, expectedDeliveryDate, deliveryDate, postponedDate, createdDate, notes, isFollowUp(علم), attachments`

### Customer (التاجر/المتجر)
`id, businessName, fullName, email, phone, address(كامل), hubId, paymentTypeId, category, status(VERIFIED…), isPricingPerServiceTypeEnabled, isEnableCustomerWallet, walletBalance, pricingListId`

### Driver/User
`id, firstName/lastName, email, phone, role(DISPATCHER|ACCOUNTANT|CUSTOMER_CARE|DRIVER|ADMIN|SALES), hubId, city, address, status, driverType(TYPICAL), vehicleId`

### Vehicle
`id, name(model), brand, plateNo, volume, driverId, hubId, noOfPkgs, insuranceExpiryDate, licenseExpiryDate, vehicleTypeId`

### Hub (فرع) / Partner (شريك)
`id, name, address, city, manager…` / `id, name, status(ACTIVE), rating…`

### COD / محاسبة
- **CodReceipt (استلام):** driverId, packages[], totalCod, totalCost, receivedMoney, receivedAt
- **MassCodReport (كشف مفرز/مصدَّر/مسلَّم):** customerId, packages[], totalCod, totalCost, vatSum, status(SORTED_BY_ACCOUNTANT → EXPORTED → DELIVERED), deliveredWithoutCustodyRelease
- **Expense:** type(driver|hub|partner|other), amount, note, date
- **FinancialSummary (محسوبة):** deliveredPackagesCodSum, deliveredPackagesCostSum, returnedPackagesCostSum, partnerCostSum, expensesSum(driver/hub/partner/other), driverEarningsSum, vatSum, profit, netProfit, customersCod

### Pricing
- **CompanyPrice:** serviceTypeId, originCityId, destinationCityId, price, returnPrice
- **CustomerPricing:** customerId, overrides…

### مرجعية
- **ServiceType:** name/arabicName, expectedDeliveryHours, expectedPickupHours, color, shipmentTypes[], vehicleTypes[]
- **PaymentType:** name/arabicName, paymentType(CASH|MADA|VISA|MASTER), isDefault, isHidden
- **Region → City → Village** (3 مستويات)
- **Recipient:** دفتر مستلمين

---

## 4. الفجوات مقابل `prisma/schema.prisma` الحالي

| المجال | الموجود في QBL | الفجوة / المطلوب |
|---|---|---|
| الطلب | `DeliveryOrder` (6 حالات، بدون COD) | إضافة: `codAmount, deliveryFee, paymentMethod, codStatus, barcode, hubId, notes, postponedAt, isFollowUp` وتوسيع `OrderStatus` (موافقة/تأجيل/إرجاع/إلغاء) |
| COD | لا يوجد | نماذج جديدة: `CodCollection` (عهدة سائق → استلام)، `CodSettlement` (كشف عميل: SORTED/EXPORTED/DELIVERED)، `Expense` |
| التسعير | لا يوجد | `PriceList`/`CityPrice` (مصدر × وجهة × نوع خدمة) + تسعير لكل عميل |
| الفروع | لا يوجد | `Hub` (فرع) + ربط الطلب بالفرع |
| الشركاء | لا يوجد | `Partner` + تصدير طرود للشريك (مؤجل — أولوية منخفضة) |
| المرجعية | `serviceType` نص حر | نماذج `ServiceType`, `PaymentMethod` مرجعية (بدأنا بـ enum `PaymentMethod`) |
| المناطق | نص حر في العناوين | شجرة Region/City/Village (مؤجل — يكفي city نصي حاليًا) |
| العملاء | `ClientAccount` (تاجر) + `Customer` (مستلم) | متوافق مفهوميًا مع المصدر (Customer=تاجر، Recipient=مستلم) — إضافة رصيد/طريقة دفع للتاجر لاحقًا |
| المستخدمون | Role enum (5 أدوار) | إضافة دور `ACCOUNTANT` (اختياري لاحقًا) |

**قرار الترحيل:** لا نستنسخ الـ 22 حالة حرفيًا — نحتفظ بحالات QBL ونضيف الناقص تشغيليًا: `PENDING_APPROVAL, POSTPONED, RETURNED, CANCELLED` مع خرائط عرض عربية.

---

## 5. خطة البناء (المرحلة 2) — الأولويات

1. **إدارة الطلبات** `app/(admin)/admin/orders` — جدول بفلاتر (حالة/عميل/تاريخ/بحث)، إجراءات (تعيين مندوب، تغيير حالة، موافقة)، KPI cards.
2. **المناديب والأسطول** `admin/fleet` — جدول مناديب (حالة/عهدة/إنجاز) + مركبات (تأمين/رخصة/سعة).
3. **التقارير والتحليلات** `admin/reports` — تقرير مناديب + تقرير عملاء نشطين + توزيعات حسب الحالة/المدينة.
4. **الفوترة وتحصيل COD** `admin/cod` — عُهدات المناديب، استلام، كشوفات العملاء (فرز → تصدير → تسليم)، ملخص مالي، مصروفات.

**الأساسات:** `app/(admin)/admin/layout.tsx` (سايدبار RTL بألوان QBL) + `app/api/admin/*` (حماية بالدور ADMIN/OPS_MANAGER) + `lib/admin/*` (types + mock adapters قابلة للاستبدال بـ Prisma) + توسيع schema (COD/Expense/Hub/PriceList).

**خارج نطاق هذه المرحلة:** إدارة الرجيع كوحدة مستقلة، الشركاء وشبكتهم، قواعد الشحن الذكية، Webhooks، شجرة المناطق ثلاثية المستويات، أرشيف مستقل — موثقة أعلاه للمراحل القادمة.

---

## 6. حالة التنفيذ والقرارات التقنية

### الصلاحيات (Role guard)
الوصول للوحة مقصور على `ADMIN` و`OPS_MANAGER` عبر `lib/admin/guard.ts`:

- `requireAdmin()` — يحمي `app/api/admin/*` ويعيد 403.
- `requireAdminPage()` — يحمي `app/(admin)/admin/*` ويعيد توجيهًا (307) إلى `/`.

الحارس مطبَّق في الـ layout **وفي كل صفحة على حدة**: صفحات Next.js قد تُنفَّذ بالتوازي مع الـ layout، فالاعتماد على الـ layout وحده لا يمنع تحميل البيانات. تم التحقق: `COURIER`/`CLIENT`/`DISPATCHER` → 307 بلا أي تسريب لبيانات COD أو المالية.

### Migration
`prisma/migrations/` — سلسلة من هجرتين: `20260713081050_init` (المخطط كاملًا، 23 جدولًا) ثم `20260713090000_admin_fleet_fields`. نماذج وحدة الإدارة الجديدة: `Hub`, `CodCollection`, `CodSettlement`, `Expense`, `PriceList`, `CityPrice`، و4 enums: `PaymentMethod`, `CodStatus`, `CodSettlementStatus`, `ExpenseType`.

التطبيق على قاعدة بيانات جديدة: `npx prisma migrate deploy`.

### طبقة البيانات
`lib/admin/data.ts` يعرض `getAdminDataSource()` كواجهة (`getOrders`/`getFleet`/`getReports`/`getCod`/`getDashboard`). التنفيذ يتبدّل تلقائيًا: `prisma-source.ts` عند توفر `DATABASE_URL`، وإلا `mock.ts` (تطوير بلا قاعدة بيانات). الصفحات لا تعرف أيّ المصدرين يعمل.

الكتابات في `lib/admin/mutations.ts` (`approveOrders`, `assignCourier`, `changeStatus`, `receiveCustody`, `sortSettlement`, `advanceSettlement`) وتُستدعى من `PATCH /api/admin/orders` و`/api/admin/cod`.

> **لم يُتحقَّق منه:** مسار Prisma لم يُشغَّل مقابل قاعدة بيانات حيّة في هذه الجلسة (قاعدة البيانات المحلية متوقفة). التحقق التشغيلي تم على مسار الـ mock فقط.
