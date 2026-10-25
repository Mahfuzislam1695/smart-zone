# SmartZone POS — Product Documentation

SmartZone POS is a multi-tenant SaaS point-of-sale and shop-management system for **mobile phone and accessories shops in Bangladesh**. Each shop (tenant) gets its own workspace with branches, IMEI-level inventory, sales, dues, installments, and reports. The platform owner sells subscriptions to shops.

The first customer (the **pilot tenant**) is Zobayer Smart Zone, Ulipur, Kurigram. Everything is designed as a white-label product. No feature, text, or data is specific to the pilot tenant except the seed data.

> "SmartZone POS" is a working name. To rename it, change `NEXT_PUBLIC_APP_NAME` and the marketing copy. The name is not used in code identifiers.

## Reading order

| # | Document | Read it when |
|---|----------|--------------|
| 01 | [Product overview](01-product-overview.md) | First. Vision, market, personas, scope |
| 02 | [Feature specification (PRD)](02-feature-spec.md) | Before building any module. Stories, rules, acceptance criteria |
| 03 | [Architecture](03-architecture.md) | Before writing code. Next.js 16 structure, tenancy, caching, security |
| 04 | [Data model](04-data-model.md) + [schema.draft.prisma](schema.draft.prisma) | Before touching the database. ERD, rules, validated Prisma 7 schema |
| 05 | [Roles & permissions](05-roles-permissions.md) | When adding any action or page |
| 06 | [SaaS billing](06-saas-billing.md) | Plans, limits, payments, suspension |
| 07 | [i18n & printing](07-i18n-printing.md) | Bangla/English, BDT formatting, invoices, barcode labels, scanners |
| 08 | [Integrations](08-integrations.md) | SMS and payment gateways, env vars |
| 09 | [UI / UX](09-ui-ux.md) | App shell, POS screen, design tokens |
| 10 | [Roadmap](10-roadmap.md) | What to build in what order, acceptance gates |
| 11 | [Legacy gap analysis](11-legacy-gap-analysis.md) | Comparison with the previous "Shop ERP" the client used |
| 12 | [Developer guide](12-dev-guide.md) | Local setup, conventions, testing, deployment |
| 13 | [Brand guide](13-brand.md) | Logo, colors, type, voice. Read before any UI work |

## Core invariants (never break these)

1. **Every tenant-owned row has `tenantId`, and every query filters by it.** Tenant scoping happens in the data access layer, never in UI code. See [03 § Tenancy](03-architecture.md#tenancy).
2. **Money is stored as integer paisa** (`Int`, 1 BDT = 100 paisa). No floats anywhere in money math.
3. **An IMEI/serial is unique per tenant** and identifies exactly one physical unit for its whole life.
4. **Stock changes only through stock movements** written in the same DB transaction as the business document (sale, purchase, return, transfer, adjustment).
5. **Posted documents are immutable.** Corrections are made with reversing documents (returns, adjustments, void), never by editing a posted sale or purchase.
6. **Tenant data is never cached server-side unless the tenant id is part of the cache key and tag.** See [03 § Caching](03-architecture.md#caching-with-cache-components).
7. **All business timestamps are stored in UTC and shown in `Asia/Dhaka`.** "Today" and report day boundaries use Asia/Dhaka.

## Glossary

| Term | Meaning |
|------|---------|
| Platform | The SaaS as a whole, operated by the platform owner (us) |
| Tenant / Shop | One paying business. Owns all its data |
| Branch | A physical outlet or warehouse of a tenant. Stock is held per branch |
| Member | A user who belongs to a tenant with a role (Owner, Manager, Cashier, custom) |
| Product | A sellable model, e.g. "Samsung Galaxy A15" or "Anker 20W charger" |
| Variant | A specific SKU of a product, e.g. "A15 8/128 Blue". Prices live here |
| Serialized item | A variant tracked unit by unit (phones, tablets, smartwatches) |
| Non-serialized item | A variant tracked by quantity (covers, chargers, cables) |
| Stock unit | One physical serialized item, identified by IMEI1/IMEI2/serial |
| Stock movement | A ledger row recording any change in stock |
| Due (বাকি) | Unpaid balance a customer owes the shop |
| Payable | Unpaid balance the shop owes a supplier |
| Installment / EMI (কিস্তি) | Shop-financed sale paid in scheduled parts. Card EMI from a bank is a *payment method*, not this |
| Trade-in / Buy-back | The shop buys a used phone from a customer, as stock or as part payment |
| Cash session | One cashier's drawer from opening to closing |
| Paisa | 1/100 BDT. Money unit used in storage |
