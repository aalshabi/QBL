# Public claim register

Last reviewed: 2026-10-14. This register is the publication gate for `qbl.sa`.

| Claim or capability | State | Public wording allowed | Evidence / gate |
|---|---|---|---|
| Beauty Shield product-and-route assessment | Ready | Assessment before an operating commitment | Structured quote intake and published assessment flow |
| Temperature protection for cosmetics/personal care in Riyadh | Ready | Protection selected from product instructions and route conditions | Current approved positioning; final scope remains contractual |
| Insulated bag / box options | Pilot | May be proposed after assessment | Requires client-specific equipment and acceptance record |
| Delivery documentation | Pilot | Available only when specified and acceptance-tested | Technical model exists; no universal production proof supplied |
| Temperature telemetry | Pilot | Experimental; not a live promise | Data model/UI exist; sensor, calibration, freshness, and production trace are unverified |
| Public tracking | Unknown | Only a private link when included in scope | Repository uses synthetic fixtures outside production; real source-of-truth adapter is not proven |
| OTP/POD | Unknown | Do not promise publicly | Technical paths exist; production notification/provider and end-to-end trace are unverified |
| Frozen delivery | Unknown | Do not advertise | No validated vehicle/range/capacity evidence supplied |
| Pharmaceutical delivery | Unknown | Do not advertise | No regulatory, operating, or acceptance evidence supplied |
| Salla/Zid/Shopify integration | Planned | Intake question only; never claim support | No verified app registration, scopes, sandbox trace, or production smoke trace |
| LogesTechs read integration | Pilot | Read-only technical integration under review | Code and tests cover configuration/status mapping; live contract and webhook security are incomplete |
| 10–15 second location freshness | Unknown | Do not publish | UI copy/design existed without production telemetry evidence |
| Fixed response/delivery SLA | Unknown | Values must be contract-specific | No approved historical performance evidence supplied |

## Publication rule

A capability may move to **Ready** only when its owner, acceptance criteria, environment, evidence URL or test ID, and review date are recorded. `Pilot`, `Planned`, and `Unknown` claims must be qualified exactly as shown above or omitted.

## Owner/legal review gate

`app/(marketing)/privacy/page.tsx` and `app/(marketing)/terms/page.tsx` are conservative operational drafts. Before production deployment, the QBL owner/legal reviewer must approve retention periods, processor disclosures, data-subject request handling, governing law, limitation language, and the official privacy contact. This repository change does not represent legal approval.
