# QBL WhatsApp Cloud API readiness

Updated on 2026-10-16 (Asia/Riyadh). This document records evidence; it does not authorize production messaging.

## Account evidence

- Meta Business Portfolio: `Qaddam Babak Logistics QBL` (`27915592501402579`).
- Existing WhatsApp messaging account: `Qaddam Babak Logistics QBL` (`2308443083315759`), currency SAR, timezone Asia/Riyadh.
- Account state: **Restricted (permanent)** until Meta Business Verification is completed.
- Restriction explicitly blocks starting conversations, replying to customers, and adding phone numbers.
- Phone numbers: none. Payment method: none. Templates: not submitted.
- Abdullah reports purchasing a 360dialog subscription on 2026-10-15. The Hub recognizes the account name `Abdullah Alshabi`, but requires owner MFA enrollment before account, plan, channel, WABA, number, template, webhook, or invoice details can be inspected. Therefore the purchase and activation state remain **reported, not independently verified**.
- Earlier 360dialog support evidence confirmed a client record existed, with no channel or number connected at that time. That evidence predates the reported subscription and cannot prove current readiness.

## Official pricing evidence

360dialog's official pricing documentation was checked on 2026-10-16. Its published channel tiers are USD 59/month Standard, USD 119/month Premium, and USD 299/month Higher Throughput. A channel becomes billable when activated and remains billable until manually cancelled; renewal is on the first day of each month. The exact QBL plan, activation date, invoice currency, taxes, and cancellation state cannot be verified until Abdullah completes Hub MFA. These license fees are separate from Meta message charges.

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

360dialog's official coexistence documentation was checked on 2026-10-16. It states that eligible WhatsApp Business App numbers can use Cloud API while preserving the mobile app and chat history, but Meta decides number eligibility and applies geographic/account limitations. Cloud API messages remain billable and require an active 360dialog plan. This is general product evidence, not proof that `+966536641108` is eligible.

## Implemented 360dialog workflow (local branch only)

- Provider adapter uses `https://waba-v2.360dialog.io/messages` with server-only `D360-API-KEY` authentication.
- Webhook intake requires a constant-time checked `X-QBL-Webhook-Token` custom header. 360dialog officially supports custom headers on the configured channel webhook.
- Initial messages remain fail-closed behind `WHATSAPP_SEND_ENABLED=false`, consent evidence, shipment readiness, daily count guard, and daily cost guard.
- Communication state (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`) is separate from customer outcome (`PENDING`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `DECLINED`, `NO_REPLY`, `MANUAL_REVIEW`, `OPTED_OUT`).
- The default early warning is 15 minutes and no-response deadline is 30 minutes. Customer-silence timers start only from a confirmed `delivered` callback. A sent message without delivery creates a separate `DELIVERY_UNKNOWN` alert.
- A five-minute authenticated cron evaluates durable deadlines. Alerts are idempotent, persist across restarts, use the latest courier assignment, and never cancel or complete the shipment.
- The protected `/admin/whatsapp` dashboard separates awaiting, ready, overdue, failed-delivery, and review cases in Asia/Riyadh and provides audited operational decisions.
- No verified internal alert destination is configured for this workflow. Dashboard alerts are complete; external SMS, email, or employee WhatsApp alerts remain disabled rather than guessing a recipient.
- Quoted replies correlate to the referenced outbound message. Multiple unresolved shipments on one phone without quoted context go to review; voice notes and attachments are stored only as redacted type markers and go to review.
- Late replies resolve open alerts; opt-out revokes delivery-message consent; expired outbox leases recover; the eighth failed attempt dead-letters.

Database-backed tests passed against an isolated PostgreSQL 16 database on 2026-10-16. No production migration, provider configuration, live message, template submission, billing change, or number migration occurred.

## Launch gates

1. Abdullah completes the already-open 360dialog MFA enrollment, then the Hub is inspected read-only.
2. Verify the actual purchased plan, recurring/cancellation charges, channel activation, WABA, QBL-owned number `+966536641108`, quality state, messaging limit, templates, and webhook configuration.
3. Meta/360dialog confirms the actual coexistence path and messaging tier for that number before any registration or migration.
4. Merchant/fulfilment opt-in evidence is approved and loaded; possession of a phone number is insufficient.
5. Arabic COD and non-COD utility templates are approved by Meta.
6. Production secrets are entered only in the hosting secret store; no secret enters Git or logs.
7. Production database migration, webhook configuration, credential entry, pilot budget, daily hard limits, and real-number sends receive separate launch approval.

The default remains `WHATSAPP_SEND_ENABLED=false`; the initial limit is 25/day and USD 1/day until a reviewed pilot budget replaces them.
