# QBL Cosmetics Cold Chain — Website and Positioning Audit

Date: 2026-07-14  
Scope: the live Beauty Shield branch (`claude/new-session-fnwkx4`) and the public routes it defines.

## Executive verdict

QBL's defensible identity is not “general refrigerated transport.” It is a Riyadh-focused, last-mile thermal-protection operator for cosmetics and temperature-sensitive beauty products. `Beauty Shield` is the commercial product. QBL is the legal/corporate brand.

The site now communicates this clearly. The remaining commercial gap was a single, procurement-ready company profile that combines legal identity, problem, solution, protection levels, operating model, target sectors, quality principles, limits, and next step without forcing a buyer to open eight pages. `/company-profile` closes that gap.

The site must continue to avoid three unsupported positions:

1. claiming formal SFDA approval or compliance certification;
2. promising continuous temperature logging unless it is included in the signed operating model;
3. publishing case-study outcomes or reduction percentages before reviewed operating data exists.

## Page-by-page review

| Page | Strengths | Weaknesses / risk | Fit with specialization | SEO improvement | Conversion improvement |
|---|---|---|---|---|---|
| `/` | Clear category, Saudi-heat problem, Beauty Shield, three levels, target buyers, pilot CTA. | Repeats several points also found on deeper pages; lacks proof from real pilots. | Excellent. Cosmetics is the primary category. | Add internal links from product groups to specific educational pages. Add verified proof only when available. | Keep one dominant CTA: pilot. Add client proof after approval and evidence. |
| `/beauty-shield` | Strong product explanation, clear three-tier model, limits and pilot journey. | Long page; procurement information is distributed elsewhere. | Excellent. This is the commercial product page. | Add Product/Service schema only for facts currently offered. | Add a compact downloadable/profile route and a sticky pilot CTA on mobile if testing supports it. |
| `/why-protection` | Educates without overselling refrigeration; manufacturer instructions are the decision rule. | Scientific claims need source governance before expansion. | Excellent category-education page. | Cite primary manufacturer/regulatory sources in future editorial revisions. | Add an inline “send storage instructions” CTA after the decision matrix. |
| `/protection-levels` | Clear distinction between heat protection, controlled temperature, and refrigeration. | “Measurement” can be misread as standard on every job. Existing caveats reduce this risk. | Excellent. Core differentiation. | Target Arabic and English keyword variants naturally in headings and metadata. | Add a short buyer checklist: product, storage instruction, volume, route, delivery window. |
| `/sectors` | Matches the required audiences: brands, distributors, e-commerce, D2C, pharmacies, clinics, salons. | No sector-specific proof or commercial package yet. | Excellent. Food is explicitly secondary. | Create sector landing pages only when each can contain unique, evidence-based content. | Add sector-prefilled pilot form parameters later. |
| `/how-it-works` | Concrete journey, service window, attempts, reverse logistics, current limits. | Some capabilities depend on the signed operating model; wording is mostly careful. | Strong. Converts positioning into operations. | Add HowTo schema only after checking eligibility and exact correspondence to page content. | Show a sample redacted delivery report when one exists. |
| `/quality` | Strongest trust behavior: states what QBL does and does not claim. | It is not an SFDA compliance page and should not be marketed as one. | Strong and credible. | Keep title around “quality and regulatory readiness.” Do not target “SFDA certified” terms. | Add controlled-document list or certificates only after legal review and publication approval. |
| `/faq` | Handles refrigeration misconceptions and operating boundaries directly. | FAQ rich results are not guaranteed; content should serve buyers first. | Strong. | Keep FAQ schema synchronized with visible questions. Add new questions from real sales calls. | Add contact/pilot CTA after high-intent answers such as integration and service area. |
| `/about` | Gives the company a focused founding story, official data, and principles. | The story is positioning-led; it still lacks leadership and verified operating milestones. | Strong. | Add Organization facts only when verified. | Link to the company profile for procurement and partnership buyers. |
| `/trial` | Low-risk offer and detailed qualification form. | Conversion will depend on response SLA and operational follow-up, not page design alone. | Excellent primary CTA. | Add privacy/consent language and conversion tracking documentation. | Define internal lead-response SLA, owner, and qualification stages. |
| `/cold-chain-system` and subpages | Demonstrates the intended operating system and creates technical confidence. | Must never imply mock or planned functionality is live. | Supporting evidence, not the lead story. | Consider `noindex` for demo-only routes until their claims match production. | Label demo/planned capabilities explicitly and direct buyers back to the pilot. |
| `/track` | Reinforces visibility and delivery experience. | A demo can be mistaken for a live customer record or universal capability. | Useful support page. | Use descriptive metadata and avoid indexing sample tokens. | Explain what tracking data is available under each operating model. |
| `/company-profile` | New procurement-ready, printable profile with facts, limits, operating model, audiences, quality, and pilot CTA. | Needs real photography and verified case evidence when available. | Excellent. Built entirely around cosmetics cold chain. | Indexed in sitemap with focused metadata and breadcrumb structured data. | Gives procurement a printable/PDF path and a direct pilot CTA. |

## Information architecture recommendation

### Keep as primary pages

- `/beauty-shield`
- `/why-protection`
- `/protection-levels`
- `/sectors`
- `/how-it-works`
- `/quality`
- `/faq`
- `/about`
- `/company-profile`
- `/trial`

### Do not create as duplicate pages

- `Temperature Control`: `/protection-levels` already serves this intent. Create an alias only if search data proves demand and canonicalize it.
- `Industries We Serve`: `/sectors` already serves this intent.
- `Why Cosmetics Need Cold Chain`: `/why-protection` already serves this intent.

### Create only after evidence exists

- `/case-studies`: publish after at least one approved client story with baseline, method, period, sample size, and reviewed outcome.
- `/sfda-compliance`: publish only after legal review identifies the exact regulations applicable to QBL's transport role and the company can document how each requirement is met. Until then, `/quality` is the correct page.
- sector-specific landing pages: create after QBL has a distinct offer or evidence for each sector.

## Messaging hierarchy

1. **Category:** Cosmetics Cold Chain Logistics.
2. **Problem:** Saudi heat can compromise sensitive beauty products and the brand experience during the last mile.
3. **Product:** QBL Beauty Shield.
4. **Method:** three protection levels selected from manufacturer storage instructions.
5. **Operating promise:** protected, documented last-mile delivery inside Riyadh under an agreed operating model.
6. **Risk reversal:** limited pilot before a long-term contract.
7. **Trust rule:** proof before claims.

## SEO priorities

1. Preserve a single canonical URL per search intent; do not create English-named duplicate pages for existing Arabic routes.
2. Build topical authority through evidence-based articles around storage instructions, heat exposure, packaging, returns, and delivery operations.
3. Add verified first-party proof: approved case studies, redacted reports, process documents, and service-area facts.
4. Keep Organization, LocalBusiness, Service, Breadcrumb, and FAQ structured data synchronized with visible content.
5. Review demo/system routes for `noindex` until every visible capability reflects production.
6. Add Arabic/English terminology naturally: Cosmetics Cold Chain Logistics, Beauty Logistics, Temperature Controlled Delivery, and Last-Mile Refrigerated Delivery.

## Conversion priorities

1. Make the pilot the single primary conversion across marketing pages.
2. Define an operational response SLA for every pilot lead.
3. Capture: company, sector, product types, manufacturer storage instructions, monthly volume, pickup location, delivery areas, desired start date, and special handling.
4. Add a consent/privacy line and analytics events for form start, submit, success, and qualified lead.
5. Use the company profile in sales outreach and procurement follow-up.
6. Add proof only after it is approved, attributable, and reproducible.

## Standard and contrarian roadmap

### Standard: proof-led category leader

- Benefit: builds authority safely through the profile, educational pages, pilot reports, and approved case studies.
- Risk: proof accumulates more slowly than marketing claims.
- Mitigation: standardize pilot reporting so every eligible engagement can become evidence.

### Contrarian: own “thermal protection,” not “refrigeration”

- Benefit: avoids overselling costly refrigeration and differentiates QBL through product-specific protection levels.
- Risk: some buyers search only for “refrigerated delivery” and may misunderstand the category.
- Mitigation: retain the refrigerated-delivery term as level three while leading with Beauty Shield and manufacturer-instruction-based selection.
