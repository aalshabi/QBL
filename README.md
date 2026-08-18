# قدام بابك QBL Logistics Platform

منصة MVP إنتاجية لشركة **قدام بابك للخدمات اللوجستية** باختصار **QBL**، متخصصة في **التوصيل المبرّد آخر ميل** داخل الرياض. الواجهة عربية أولًا مع هيكل يدعم الإنجليزية وRTL/LTR.

## ما تم بناؤه

- Marketing Website عربي احترافي: الرئيسية، من نحن، الخدمات، القطاعات، لماذا نحن، الأسطول والتقنيات، السلامة والامتثال، بروفايل الشركة، طلب عرض سعر، تواصل، تتبع الشحنة.
- Customer Tracking عبر رابط JWT signed مؤقت في `/track/[token]`.
- OTP/PIN handover logic: توليد/تشفير OTP، تحقق، إعادة إرسال mock، منع إغلاق الطلب كـ Delivered بدون OTP أو override بصلاحية مدير عمليات.
- Ops Dashboard في `/ops`: خريطة mock لجميع المناديب، الطلبات النشطة، التنبيهات، الحرارة، المتأخرات، Audit Log، وإعادة إسناد واجهية.
- Courier PWA في `/courier`: مهام اليوم، تحديثات الحالة، إدخال OTP، إثبات تسليم، تعذر التسليم.
- PWA installable: manifest، service worker، أيقونات QBL، وصفحة offline.
- Prisma schema كامل لـ PostgreSQL مع seed واقعي للرياض.
- Adapters جاهزة للاستبدال: Maps و SMS/WhatsApp notifications و SSE.

## Architecture Summary

- `app/`: Next.js App Router للصفحات و API route handlers.
- `components/`: مكونات UI قابلة لإعادة الاستخدام، تسويق، تتبع، عمليات، مندوب.
- `lib/`: الدومين، المحتوى الرسمي، mock data، security، auth، adapters، Prisma lazy client.
- `prisma/`: `schema.prisma` و `seed.ts`.
- Security: روابط التتبع موقعة بـ `jose`، OTP مخزن كـ hash مع pepper، بيانات العميل في tracking snapshot محدودة بطلب واحد.
- Realtime: SSE endpoint في `/api/ops/stream`، وواجهة map adapter حاليًا mock قابلة للتحويل إلى Google Maps أو Mapbox.

## Sitemap + User Flows

- Public: `/`, `/about`, `/services`, `/sectors`, `/why-us`, `/fleet-tech`, `/compliance`, `/company-profile`, `/quote`, `/contact`, `/track`.
- Customer: يستلم رابطًا موقّعًا -> يفتح `/track/[token]` -> يرى الحالة والمندوب وETA والحرارة وOTP masked -> الرابط يغلق بعد التسليم أو انتهاء الصلاحية.
- Courier: يدخل `/courier/login` -> يفتح `/courier` -> يبدأ الرحلة -> يصل -> يدخل OTP -> يغلق الطلب أو يسجل تعذر التسليم.
- Ops: يفتح `/ops` -> يراقب المناديب والطلبات -> يصفي حسب الحالة -> يعالج التأخير/الحرارة -> يعيد الإسناد -> يرى Audit Log.

## Database Schema

النماذج الأساسية في `prisma/schema.prisma`:

`Company`, `User`, `Role`, `UserRole`, `Customer`, `ClientAccount`, `Courier`, `Vehicle`, `DeliveryOrder`, `DeliveryStop`, `TrackingSession`, `OtpCode`, `LocationPing`, `TemperatureReading`, `NotificationLog`, `AuditLog`, `ProofOfDelivery`.

## Environment

انسخ `.env.example` إلى `.env` وعدّل القيم:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qdl?schema=public"
APP_URL="http://localhost:3000"
TRACKING_TOKEN_SECRET="replace-with-a-long-random-tracking-secret"
OTP_PEPPER="replace-with-a-long-random-otp-pepper"
MAP_PROVIDER="mock"
SMS_PROVIDER="mock"
WHATSAPP_PROVIDER="mock"
```

## Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

افتح:

- Website: `http://localhost:3000`
- Ops: `http://localhost:3000/ops`
- Courier: `http://localhost:3000/courier`
- Tracking sample: `http://localhost:3000/track`

## PWA

التطبيق يدعم التثبيت على الجوال والمتصفح:

- Manifest: `/manifest.webmanifest`
- Service worker: `/sw.js`
- Offline fallback: `/offline`
- App icons: `/icons/icon-192.svg`, `/icons/icon-512.svg`

في المتصفح افتح الموقع ثم اختر Install / Add to Home Screen عند ظهور خيار التثبيت.

## API Overview

- `GET /api/tracking/[token]`: public tracking snapshot.
- `POST /api/tracking/[token]/resend-otp`: mock resend OTP.
- `POST /api/orders/[id]/verify-otp`: verifies OTP. Demo OTP is `123456`.
- `POST /api/orders/[id]/status`: status mutation with delivered blocking rules.
- `POST /api/courier/location`: courier location ping.
- `GET /api/ops/stream`: SSE operations updates.
- `POST /api/quote`: quote lead mock endpoint.
- `GET /api/admin/integrations/logestechs/health`: فحص اتصال LogesTechs للإدارة فقط.
- `POST /api/admin/integrations/logestechs/package-status`: معاينة حالات حتى 20 شحنة من LogesTechs دون تعديل البيانات المحلية.
- `GET /api/admin/integrations/google-maps/health`: فحص حي وآمن لـPlaces Text Search وPlace Details للإدارة فقط.
- `POST /api/admin/integrations/google-maps/resolve`: فحص حتى 20 عنوانًا تشغيليًا بعد إزالة بيانات العميل، مع رفض المواقع غير الموثوقة أو خارج الرياض.

## ما يحتاج مفاتيح API حقيقية

- SMS/WhatsApp provider في `lib/notifications/adapter.ts`.
- Browser map يبقى في `https://www.qbl.sa/route-optimizer` لأن مفتاح المتصفح مقيد إلى نطاق QBL؛ لوحة الإدارة تستخدم مفتاح الخادم مع Places API (New) فقط.
- Auth provider/session hardening بدل cookie dev في `lib/auth.ts`.
- Object storage لإثبات التسليم بالصور والتواقيع.

## Acceptance Checklist

- [x] الموقع عربي أولًا ومتجاوب.
- [x] محتوى الشركة الرسمي مدمج.
- [x] رابط تتبع موقّع ومؤقت.
- [x] صفحة العميل لا تعرض إلا بيانات الطلب.
- [x] OTP مطلوب قبل التسليم.
- [x] override يدوي يحتاج صلاحية وسبب audit.
- [x] لوحة عمليات بخريطة وقوائم وتنبيهات.
- [x] واجهة مندوب mobile-first.
- [x] Prisma schema و seed data.
- [x] adapters للتكاملات الخارجية.
- [x] `npm run lint` و `npm run build` ناجحان.

## أهم الملفات للتعديل السريع

- المحتوى والهوية: `lib/company.ts`
- بيانات العرض: `lib/mock-data.ts`
- Prisma: `prisma/schema.prisma`, `prisma/seed.ts`
- الصفحة الرئيسية: `app/page.tsx`
- لوحة العمليات: `components/ops/ops-dashboard.tsx`
- التتبع: `components/tracking/tracking-view.tsx`
- المندوب: `components/courier/courier-app.tsx`
- التكاملات: `lib/maps/adapter.ts`, `lib/notifications/adapter.ts`
- Google Maps الخادمي: `lib/google-maps/client.ts` ومسارات `app/api/admin/integrations/google-maps/`.

## Future Improvements

- ربط فعلي بـ PostgreSQL في كل route handler بدل mock fallback.
- Auth كامل باستخدام مزود موثوق وRBAC على مستوى قاعدة البيانات.
- WebSocket أو managed realtime لتحديث حركة المناديب.
- خرائط فعلية مع geofencing وحساب ETA.
- بوابة عملاء للحسابات المؤسسية وتقارير SLA.
- تقارير امتثال حرارية قابلة للتصدير.
- تطبيق مندوب PWA مع service worker وbackground sync.
