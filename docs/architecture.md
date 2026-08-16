# QBL MVP Architecture

## Executive Summary

المنصة مبنية كـ Next.js App Router موحد يجمع الموقع التعريفي، التتبع العام، واجهة المندوب، ولوحة العمليات. التصميم Arabic-first، والهوية Navy/Orange، والتكاملات الخارجية معزولة عبر adapters حتى لا يتوقف التطوير المحلي على مفاتيح SMS أو Maps.

## Project Structure

```text
app/
  (marketing)/
  (ops)/ops/
  (courier)/courier/
  api/
  track/[token]/
components/
  marketing/
  tracking/
  ops/
  courier/
  maps/
  ui/
lib/
  company.ts
  domain.ts
  mock-data.ts
  security.ts
  tracking.ts
  auth.ts
  prisma.ts
  maps/adapter.ts
  notifications/adapter.ts
  logestechs/config.ts
  logestechs/client.ts
prisma/
  schema.prisma
  seed.ts
```

## Core Decisions

- Signed tracking links use JWT with `scope=tracking` and `orderId`; only a public snapshot is returned.
- OTP is generated as 6 digits and stored hashed with pepper; demo verification accepts `123456`.
- Delivered status is blocked unless OTP is verified or an ops manager performs manual override with reason.
- Map and notification providers are mock implementations behind adapters.
- LogesTechs credentials are server-only environment variables; the protected admin health route returns connectivity metadata only and never returns credentials or city records.
- Prisma 7 uses `@prisma/adapter-pg` and a generated client in `lib/generated/prisma`.

## Data Flow

1. Ops assigns an order and marks it `OUT_FOR_DELIVERY`.
2. System creates OTP and signed tracking token.
3. Notification adapter sends tracking link and OTP.
4. Customer opens `/track/[token]`.
5. Courier sends location pings and updates status.
6. Courier enters OTP at delivery.
7. System records ProofOfDelivery and AuditLog.

## Test Checklist

- Marketing pages load on mobile and desktop.
- `/track` creates a sample signed link.
- `/track/[token]` rejects invalid tokens.
- `POST /api/orders/order-003/verify-otp` rejects bad OTP and accepts `123456`.
- `POST /api/orders/order-003/status` rejects Delivered without OTP or override.
- `/ops` renders map, filters, active orders, alerts, and audit log.
- `/courier` renders mobile delivery workflow.
