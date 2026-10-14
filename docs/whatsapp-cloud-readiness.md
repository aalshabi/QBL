# QBL WhatsApp Cloud API readiness

Verified on 2026-10-14 (Asia/Riyadh). This document records evidence; it does not authorize production messaging.

## Account evidence

- Meta Business Portfolio: `Qaddam Babak Logistics QBL` (`27915592501402579`).
- Existing WhatsApp messaging account: `Qaddam Babak Logistics QBL` (`2308443083315759`), currency SAR, timezone Asia/Riyadh.
- Account state: **Restricted (permanent)** until Meta Business Verification is completed.
- Restriction explicitly blocks starting conversations, replying to customers, and adding phone numbers.
- Phone numbers: none. Payment method: none. Templates: not submitted.
- Direct Cloud API remains the preferred lowest-subscription-cost path, but launch is blocked by verification, number selection, template approval, and a separately approved budget.

## Official pricing evidence

Meta's official pricing page was read on 2026-10-14 and was updated 2026-09-30 for rules effective 2026-10-01:

- Billing is per delivered business-to-user message; user-to-business messages are not charged.
- Non-template replies are allowed only inside the rolling 24-hour customer-service window opened by a user message.
- The first 1,000 service messages per business phone number per month are free; subsequent service messages are charged.
- Utility templates are chargeable when delivered. The published Saudi utility/service list rate is USD 0.0107 (approximately SAR 0.040125 at 3.75 SAR/USD), before any applicable tax.
- Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

### Planning scenarios (30 operating days)

| Scenario | Delivered initial utility messages | Additional business replies/reminders | Estimated Meta fees before tax |
|---|---:|---:|---:|
| Initial confirmation only | 15,000 | 0 | USD 160.50 / SAR 601.88 |
| Initial + 20% one reminder | 15,000 | 3,000 | USD 192.60 / SAR 722.25 |
| Initial + 20% reminder + 30% service reply | 15,000 | 7,500 | USD 240.75 / SAR 902.81, less up to 1,000 free service messages (USD 10.70 / SAR 40.13) |

The model separates inbound customer replies (not charged) from business replies and reminders. It does not include VAT, hosting, or future rate changes. No rate is a safe-send or anti-ban guarantee.

## Mobile and coexistence

No phone is attached, so coexistence is unproven for QBL's actual number, Saudi account, and onboarding path. Do not migrate an existing WhatsApp Business App number until Meta presents the supported coexistence flow for that exact number. The protected `/admin/whatsapp` page is a mobile-friendly exception view, not the native WhatsApp Business app.

## Launch gates

1. Abdullah completes Meta Business Verification through the official Business Support screen.
2. Abdullah selects the QBL-owned phone number and confirms whether it must retain native Business App use.
3. Meta confirms the actual coexistence/migration path and messaging tier for that number.
4. Merchant/fulfilment opt-in evidence is approved and loaded; possession of a phone number is insufficient.
5. Arabic COD and non-COD utility templates are approved by Meta.
6. Production secrets are entered only in the hosting secret store; no secret enters Git or logs.
7. Database migration, webhook subscription, pilot budget, daily hard limits, and real-number sends receive separate launch approval.

The default remains `WHATSAPP_SEND_ENABLED=false`; the initial limit is 25/day and USD 1/day until a reviewed pilot budget replaces them.
