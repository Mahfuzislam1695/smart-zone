# 01 — Product Overview

## Vision

A fast, Bangla-first shop system that a mobile phone shop owner in any Bangladeshi upazila can start using the same day. It should know every phone in the shop by IMEI, every taka a customer owes, and the real profit on every sale.

## Problem

Small and mid-size mobile shops in Bangladesh typically run on paper khata, Excel, or generic POS tools that:

- don't track phones by IMEI, so they can't answer "who bought this phone, when, at what price, is it under warranty?"
- mix up dues (বাকি) and installments (কিস্তি) in notebooks, and lose money to forgotten collections
- can't show real profit, because cost prices vary per unit and per supplier
- are English-only and hard for staff to use
- don't handle used-phone buy-back, exchanges, or warranty claims
- break down when the owner opens a second branch

The previous system the pilot tenant evaluated ("Shop ERP — Future Flow AI") covered roughly 70% of their needs. The client didn't adopt it. [11-legacy-gap-analysis.md](11-legacy-gap-analysis.md) tracks what it had and what we do differently.

## Target market

- **Primary:** mobile phone, gadget and accessories retail shops in Bangladesh, from a single counter up to 5 branches
- **Secondary:** mobile shops that also do small wholesale to other shops, and gadget shops (smartwatches, earbuds, power banks)
- **Not targeted (for now):** grocery/supermarket, pharmacy, restaurants, large distributors needing full accounting/VAT (Mushak) compliance

## Personas

| Persona | Who | Needs | Primary device |
|---------|-----|-------|----------------|
| **Owner (মালিক)** | Shop owner, often also sells at the counter | Profit, dues, cash position, stock value, staff control, works from phone too | Phone + counter PC |
| **Manager** | Trusted staff or family member running a branch | Purchases, stock, pricing, reports for their branch | Counter PC |
| **Cashier / Salesman** | Counter staff | Fast sale by scanning, print invoice, take payments, check stock and price | Counter PC with barcode scanner + thermal printer |
| **Platform admin** | Us (SaaS operator) | Onboard shops, manage plans and payments, support, suspend non-payers | Desktop |

## Product principles

1. **Scan first.** Every POS flow must be completable with a barcode/IMEI scanner and keyboard, without a mouse.
2. **Bangla first, English equal.** Every screen, invoice, and SMS works in both languages.
3. **Truth in the ledger.** Stock and money are derived from immutable movements and payments, so reports always add up.
4. **Works on cheap hardware and slow internet.** Light pages, server-rendered, small bundles, usable on a 4G phone.
5. **White-label and multi-tenant from day one.** No pilot-specific code paths.

## Scope

### In scope (product)
Catalog, IMEI inventory, purchases and suppliers, POS sales, customers and dues, shop installments, returns/warranty/exchange/trade-in, multi-branch and transfers, expenses and cash book, reports, SMS, users and roles, settings, subscription billing, platform admin. Details are in [02-feature-spec.md](02-feature-spec.md).

### Out of scope (until reconsidered)
- Full double-entry accounting, VAT Mushak returns, payroll
- E-commerce storefront / online orders
- Offline-first POS (considered in Phase 4, see [10-roadmap.md](10-roadmap.md))
- Native mobile apps (the web app is responsive; a native app is Phase 4)
- Direct integration with BTRC NEIR (we only record that the IMEI was checked)

## Pilot tenant: Zobayer Smart Zone

- **Location:** Ulipur, Kurigram
- **Business:** mobile phones (new and used) and accessories
- **Pilot goals:**
  1. All phones in stock entered with IMEI, and every sale linked to an IMEI
  2. Daily sales, profit and cash closing done in the system instead of on paper
  3. All customer dues and installments tracked, with SMS reminders
  4. The owner can see today's sales, cash and dues from their phone
- **Pilot success criteria:** 30 consecutive days of daily use, at least 95% of sales recorded with an IMEI where applicable, and a daily cash closing that matches the physical cash.

## Success metrics (product)

| Metric | Target |
|--------|--------|
| Time to complete a single-phone sale (scan → print) | < 30 seconds |
| New shop onboarding to first sale | < 1 day |
| Monthly active tenants / paying tenants | > 85% |
| Trial → paid conversion | > 30% |
| Support tickets per tenant per month | < 2 after month 1 |
