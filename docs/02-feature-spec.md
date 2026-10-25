# 02 — Feature Specification (PRD)

Each module lists its **phase** (see [10-roadmap.md](10-roadmap.md)), **user stories** with IDs, **business rules**, and **acceptance criteria** (AC). Permission keys are defined in [05-roles-permissions.md](05-roles-permissions.md). Entities are defined in [04-data-model.md](04-data-model.md).

Conventions used throughout:
- "Branch-scoped" means the action applies to the user's **active branch** (selected in the top bar). Users can only pick branches they are assigned to.
- Every create, update, void and delete writes an **audit log** entry (who, when, what, before/after).
- All lists have search, filters, sort, pagination (server-side, 25/50/100 per page) and CSV export where the user has `report.export`.
- Money input accepts taka with up to 2 decimals and is stored as paisa.

---

## M1. Authentication & onboarding — Phase 1 (signup: Phase 3)

**Stories**
- AUTH-01: As a member, I log in with **mobile number or email** plus a password.
- AUTH-02: As a member, I reset my password via an OTP sent by SMS (or email if no phone).
- AUTH-03: As a new shop owner, I sign up with shop name, my name, mobile and password, verify my mobile by OTP, and land in a 14-day trial (Phase 3).
- AUTH-04: As an owner, I invite staff by mobile number. They get an SMS with a link to set a password.
- AUTH-05: As a member of more than one tenant (rare: accountants, platform staff), I can switch tenant.
- AUTH-06: As an owner, I can see active sessions of my staff and sign them out.

**Rules**
- Mobile numbers are normalized to `+8801XXXXXXXXX`. Accepted inputs are `01XXXXXXXXX`, `8801…` and `+8801…`.
- Lock login for 15 minutes after 5 failed attempts per account. Rate-limit OTP to 3 per 15 minutes per number.
- Disabling a member invalidates their sessions on the next request (session version check, see [03](03-architecture.md#authentication)).
- A suspended tenant's members can log in but get read-only access ([06](06-saas-billing.md#suspension)).

**First-run wizard (after signup or for the pilot)**
1. Shop profile: name (bn/en), address, phone, logo
2. First branch name
3. Invoice settings: language, paper size (80mm/A4), footer text, warranty terms text
4. Optional: import products from CSV, import opening stock with IMEIs
5. Optional: invite staff

**AC**
- A cashier can't reach any `/admin` or settings page (403).
- An OTP expires in 5 minutes and is single-use.

---

## M2. Dashboard — Phase 1

**Stories**
- DASH-01: As an owner, I see for **today** (Asia/Dhaka): sales total, number of invoices, gross profit, cash collected by method, new dues, due collected, expenses.
- DASH-02: I can switch the period: today / yesterday / this week / this month / custom, and the branch: one or all (if permitted).
- DASH-03: I see alerts: low stock variants, installments due today/overdue, customers over their due limit, subscription expiring.
- DASH-04: I see a 30-day sales chart and the top 10 selling models.

**Rules**
- Profit figures are hidden for users without `report.profit.view`.
- Cashiers see only their own sales for today unless they have `report.view`.

**AC**
- Dashboard numbers equal the corresponding report totals for the same period and branch.

---

## M3. Catalog — Phase 1

**Stories**
- CAT-01: As a manager, I manage **categories** (Smartphone, Feature phone, Tablet, Smartwatch, Earbuds, Charger, Cover, …) with a bn/en name.
- CAT-02: I manage **brands** (Samsung, Xiaomi, Realme, Symphony, Walton, Apple, …).
- CAT-03: I create a **product** with category, brand, model name, description, image, a **tracking type** (`SERIALIZED` or `QUANTITY`), and warranty months (default for its variants).
- CAT-04: I add **variants** to a product. Attributes are free key/values with common presets (RAM, Storage, Color, Region/Version). Each variant has a SKU, optional barcode, **sale price**, optional **minimum sale price**, optional wholesale price, a reorder level, and an active flag.
- CAT-05: I bulk import products/variants from CSV with a downloadable template, and get row-level error reporting.
- CAT-06: I print barcode labels for variants (non-serialized) or for units (serialized) — see [07](07-i18n-printing.md#barcode-labels).
- CAT-07: I can set a branch-specific sale price that overrides the default (Phase 2).

**Rules**
- SKU is unique per tenant and auto-generated if blank (`{BRAND3}-{MODEL}-{n}`). The barcode is unique per tenant if present.
- The tracking type can't change once any stock movement exists for the product.
- Selling below **minimum sale price** requires `sale.price.override` (manager approval PIN on the POS, see M6).
- Deleting a product with history is not allowed. Archive it instead (it's hidden from POS and search but kept in reports).

**AC**
- Searching "a15" in POS finds "Samsung Galaxy A15" variants and shows per-branch stock.

---

## M4. Inventory (IMEI & stock) — Phase 1 (transfers: Phase 2)

**Stories**
- INV-01: As staff, I see stock per variant per branch: on hand, reserved (in held carts), available, average cost (if permitted), stock value.
- INV-02: As staff, I scan or type any IMEI/serial and see the **unit history**: purchase (supplier, date, cost), transfers, sale (customer, invoice, price), returns, warranty claims, current status and branch.
- INV-03: As a manager, I enter **opening stock**: quantity for non-serialized items, and the list of IMEIs/serials with unit cost for serialized items.
- INV-04: As a manager, I make **stock adjustments** (damage, lost, found, correction) with a reason. Serialized adjustments pick specific units.
- INV-05: As a manager, I run a **stock count** (physical audit): scan everything in a branch, and the system shows missing and unexpected units, and quantity differences. Posting the count creates adjustments (Phase 2).
- INV-06: As a manager, I **transfer** stock between branches: create (send) → in transit → receive. Serialized items are scanned on both sides (Phase 2).

**Stock unit status lifecycle (serialized)**

```
            purchase / opening / trade-in
                        │
                        ▼
   ┌──────────────► IN_STOCK ◄───────────────┐
   │                │   │   │                 │
   │   transfer out │   │   │ sale            │ sales return (resellable)
   │                ▼   │   ▼                 │
   │         IN_TRANSIT │  SOLD ──────────────┘
   │    receive ────┘   │   │
   │                    │   └── warranty claim ──► IN_WARRANTY_SERVICE ──► SOLD (back to customer)
   │                    │                                              └─► REPLACED
   │   adjustment       ▼
   └──── found ───── DAMAGED / LOST
                        │
          purchase return ─► RETURNED_TO_SUPPLIER
```

**Rules**
- An IMEI is 15 digits and passes a **Luhn check**. A warning appears if the check fails (some cheap handsets have invalid IMEIs). The user can override with a reason.
- A unit can carry up to 3 identifiers: IMEI1, IMEI2, serial. **All identifiers are unique per tenant**, and scanning any of them finds the unit.
- **Costing:**
  - Serialized items use **specific identification**: each unit keeps its own purchase cost, so sale profit is exact per IMEI.
  - Non-serialized items use **moving weighted average cost per branch**, recalculated on each receipt (purchase, transfer in, return in).
- Negative stock is not allowed. A sale of a non-serialized item fails if available qty < requested qty.
- Each unit records an optional **condition** (`NEW`, `USED`, `REFURBISHED`) and an optional "BTRC/NEIR status checked" flag with a date.

**AC**
- Selling the same IMEI from two counters at the same time results in one success and one clear error ("already sold on INV-…").
- The stock valuation report equals the sum of unit costs (serialized) plus qty × avg cost (non-serialized) per branch.

---

## M5. Purchases & suppliers — Phase 1 (purchase orders: Phase 2)

**Stories**
- PUR-01: As a manager, I manage **suppliers**: name, company, phone, address, opening balance (payable), notes.
- PUR-02: I create a **purchase** (receiving invoice): supplier, branch, supplier invoice no., date, lines (variant, qty, unit cost), discount, other charges (transport), paid amount + payment method(s). Remaining = payable.
- PUR-03: For serialized lines, I **scan IMEIs** into the line. The line qty equals the number of scanned units. Bulk paste of IMEIs (one per line) is also supported.
- PUR-04: I record **supplier payments** against the balance (not tied to a specific invoice) and see the **supplier ledger** with a running balance.
- PUR-05: I make a **purchase return**: pick a supplier and units/qty, and choose refund or credit to the payable.
- PUR-06: I create a **purchase order** (draft, sent to supplier by print/WhatsApp share), then receive it fully or partially into a purchase (Phase 2).

**Rules**
- Landed cost: other charges are allocated across lines **proportionally to line value** and included in unit cost.
- Posting a purchase creates stock movements, stock units, a supplier ledger entry and payment rows in one transaction.
- A posted purchase can't be edited. It can be **voided** only if none of its units were sold or moved, which reverses everything. Otherwise use a purchase return.

**AC**
- After posting, scanning any received IMEI shows it `IN_STOCK` in the chosen branch with the correct cost.
- The supplier ledger balance = opening + purchases − payments − returns.

---

## M6. POS / Sales — Phase 1

**Stories**
- POS-01: As a cashier, I open the POS screen, with focus on the scan box. Scanning an IMEI adds that unit. Scanning a barcode adds the variant (qty 1, scan again to increment). Typing text searches products.
- POS-02: I pick or quick-create a **customer** by mobile number (name optional). A walk-in customer is allowed for fully paid sales only.
- POS-03: I apply a line discount or invoice discount (amount or %), limited by my role's **max discount %**. Going above it requires a manager **approval PIN**.
- POS-04: I take **payment** in one or more methods: Cash, bKash, Nagad, Rocket, Card, Bank transfer, Card EMI (bank), plus custom methods defined in settings. Each non-cash payment can store a transaction ID. A cash tendered/change calculator is shown.
- POS-05: If paid < total, the remainder becomes **due** on the customer account (requires an identified customer and `sale.due.create`). If the customer has a due limit, exceeding it requires approval.
- POS-06: I can convert the sale to a **shop installment** (M8) instead of a plain due.
- POS-07: I can apply a **trade-in** in the same sale: the used phone is bought in (M9) and its value is applied as a payment of type `TRADE_IN`.
- POS-08: I **hold** a cart and resume it later (held carts reserve units, and expire after 24h). Several held carts per counter.
- POS-09: On completion, the invoice prints automatically (80mm or A4 per settings) and optionally sends an **invoice SMS**.
- POS-10: I can reprint any invoice. Reprints are marked "COPY".
- POS-11: As a manager, I can **void** a sale on the same day if nothing on it was returned. Voiding reverses stock, payments and dues, and requires a reason.
- POS-12: As a cashier, I see a **sales list** with filters (date, customer, payment status, cashier, branch).
- POS-13: I create a **quotation** (no stock effect), print or share it, and later convert it into a sale (Phase 2).

**Invoice contents**
Shop logo, name, address, phone; branch; invoice no.; date/time; cashier; customer name/phone; lines (product, variant, **IMEI/serial per unit**, qty, price, discount, total); subtotal, discount, VAT (if enabled), total, paid by method, change, **due**, previous due, total due; warranty period per line; terms text; QR code with the invoice verification URL (Phase 2).

**Rules**
- Invoice numbers are sequential per branch per year: `{BRANCHCODE}-{YY}-{000001}`. They're allocated in the posting transaction, so there are no gaps from failed sales.
- A sale is posted in **one DB transaction**: lock units (`status = IN_STOCK` conditional update) → decrement non-serialized stock → write sale, lines, movements, payments, ledger, cash session entry.
- The line cost snapshot (unit cost or average cost at the time of sale) is stored on the sale line, so profit never changes retroactively.
- Payments go into the cashier's open **cash session** (M11). Starting a sale without an open session prompts the cashier to open one (configurable).
- VAT is off by default. If enabled, it's a single rate, either price-inclusive or exclusive (tenant setting).

**AC**
- A one-phone sale with a scanner + Enter key flow (scan → F9 pay → Enter) completes without the mouse.
- The invoice shows the IMEI for every serialized line.
- A sale with a ৳5,000 due increases the customer's balance by exactly ৳5,000 and appears in the due report.

---

## M7. Customers & dues — Phase 1

**Stories**
- CUS-01: As staff, I manage customers: name, mobile (unique per tenant), alternative mobile, address, NID no. (optional), notes, **due limit**, tags.
- CUS-02: I see a **customer profile**: purchases, units owned (IMEIs), warranty status, dues ledger with running balance, installments, SMS history.
- CUS-03: I **collect a due** payment (any method). It's recorded in the ledger and the cash session, and a receipt prints.
- CUS-04: I see a **due list**: customers with balance > 0, sortable by amount and last payment date, filterable by branch where the due was created.
- CUS-05: I send a **due reminder SMS** to one customer or in bulk (M13).
- CUS-06: I can give a **discount/write-off** on a due (requires `customer.due.writeoff`). It's recorded as a ledger entry with a reason.
- CUS-07: I can record **advance/deposit** money from a customer (negative balance), which is used automatically on their next sale.

**Rules**
- A customer balance is always computed from ledger entries (sales due, collections, returns, write-offs, opening balance). It's never stored as an editable number.
- Due collections are not tied to a specific invoice by default (FIFO allocation is shown only on the statement).

**AC**
- The customer statement (printable, bn/en) shows opening balance, each transaction and a running balance that matches the due list.

---

## M8. Shop installments (কিস্তি / EMI) — Phase 2

**Stories**
- EMI-01: As a manager, I convert a sale into an **installment plan**: down payment, number of installments, frequency (weekly/monthly), start date, optional service charge (flat or %), and **guarantor** (name, mobile, NID, relation).
- EMI-02: The system generates a **schedule** with amounts and due dates. The last installment absorbs rounding.
- EMI-03: I record **installment collections**. Partial payments are allowed and applied to the oldest unpaid installment first.
- EMI-04: I see **due today / overdue / upcoming** lists, and the customer's installment card.
- EMI-05: Automatic **reminder SMS** go out N days before the due date and on overdue days (tenant setting).
- EMI-06: Optional **late fee** per overdue installment (flat), added as a separate charge.
- EMI-07: I can close a plan early with a settlement amount, or mark it defaulted.

**Rules**
- Plan total = sale total − down payment + service charge. The customer ledger gets the full financed amount as due. Each collection reduces it.
- The units on an installment sale are `SOLD`. Repossession is handled as a sales return (M9) with an adjustment for amounts already paid.
- Card EMI through a bank is **not** this module. It's a payment method, optionally with a bank charge %.

**AC**
- A ৳30,000 phone with ৳10,000 down and 4 monthly installments shows 4 × ৳5,000. Paying ৳7,000 clears installment 1 and leaves ৳3,000 remaining on installment 2.

---

## M9. Returns, warranty, exchange & trade-in — Phase 2

**Stories**
- RET-01: **Sales return.** I pick an invoice (or scan the IMEI), select lines/units, choose a condition (`RESELLABLE` → back to stock / `DAMAGED` → damaged stock), and settle as a refund (method) or a credit to the customer balance. A return receipt prints.
- RET-02: **Exchange.** I return units and sell new ones in one flow. The difference is paid or refunded.
- WAR-01: **Warranty claim.** I scan the IMEI and see the warranty status (sale date + warranty months). Then I create a claim with the problem description, accessories received and expected date. It moves through `RECEIVED → SENT_TO_SERVICE (brand service center / supplier) → RETURNED_FROM_SERVICE → DELIVERED`, or ends `REPLACED`. A claim receipt prints for the customer, and an SMS can go out at each step.
- WAR-02: For a replacement, the old unit becomes `REPLACED` (goes back to the supplier or a scrap list), the new unit is issued at ৳0, and the warranty continues from the original sale date (configurable).
- TRD-01: **Trade-in / buy-back.** I buy a used phone from a customer: IMEI, model (pick a variant or a generic "Used – {brand} {model}"), condition grade (A/B/C), checklist (screen, battery %, Face ID/fingerprint, box, charger), seller name/mobile/**NID (required)**, a photo of the NID and the device (Phase 2 uploads), and the price paid. The unit enters stock as `USED` with cost = price paid.
- TRD-02: The trade-in can be a standalone purchase (paid from the cash session) or applied inside a sale (POS-07).

**Rules**
- Returns are allowed within the return window (tenant setting, default 7 days). Overriding it requires `sale.return.override`.
- The refund amount defaults to the price actually paid per line, including proportional invoice discount.
- Returning a unit from an installment sale requires a manager.
- Before accepting a trade-in, the IMEI is checked against the tenant's own records. If the unit was sold by this shop, the original sale is shown.

**AC**
- After returning a resellable unit, it's `IN_STOCK` with its **original cost**, and the sale's profit report reflects the return.

---

## M10. Multi-branch — Phase 2 (single branch works in Phase 1)

**Stories**
- BR-01: As an owner, I create branches: name (bn/en), code (2–4 letters, used in invoice numbers), address, phone, and an invoice header override.
- BR-02: I assign members to branches. A member can have a different role per branch (Phase 3, otherwise one role).
- BR-03: I see consolidated reports across branches or per branch.
- BR-04: Stock transfers between branches (INV-06).

**Rules**
- The number of branches is limited by the plan ([06](06-saas-billing.md)).
- Customers, suppliers and catalog are tenant-wide. Stock, cash sessions, invoices and expenses are branch-scoped.

---

## M11. Expenses, cash book & daily closing — Phase 1 (cash sessions: Phase 1, bank accounts: Phase 2)

**Stories**
- EXP-01: As a manager, I record **expenses**: category (rent, salary, electricity, internet, transport, food, other), amount, method, branch, note, optional receipt photo (Phase 2).
- CASH-01: As a cashier, I **open a cash session** with an opening float, and **close** it by counting cash (note denominations ৳1000/500/200/100/50/20/10/5/2/1 optional). The system shows expected vs counted and the difference.
- CASH-02: As a manager, I record **cash in/out** not tied to sales (owner withdrawal, bank deposit, petty cash).
- CASH-03: As an owner, I see a **cash book** per branch per day: opening, all inflows/outflows by method, and closing.
- CASH-04: As an owner, I track **money accounts**: Cash drawer(s), bKash merchant/personal, Nagad, bank accounts. Each payment method maps to an account, so balances per account are visible. Transfers between accounts are supported (Phase 2).

**Rules**
- Expected cash = opening float + cash sales + cash due collections + cash in − cash refunds − cash expenses − cash out − trade-in cash paid.
- A closed session can't be edited. A difference over a threshold (tenant setting) requires a note.

**AC**
- The daily closing report for a branch equals the sum of its sessions, and the sum of payments by method equals the sales report's payment breakdown.

---

## M12. Reports — Phase 1 (basic) / Phase 2 (full)

All reports: period + branch filters, bn/en, print (A4) and CSV export, and totals that reconcile with each other.

| Report | Phase | Contents |
|--------|-------|----------|
| Sales summary | 1 | By day/cashier/branch/payment method; invoices, gross, discount, returns, net |
| Sales detail | 1 | Each invoice/line with IMEI |
| Profit | 1 | Net sales − cost of goods (from line cost snapshots) − returns; by invoice, product, brand, category; **profit per IMEI** |
| Stock | 1 | On hand per variant/branch, value at cost, aging (days in stock, serialized) |
| Low stock / reorder | 1 | Variants under reorder level |
| Customer dues | 1 | Balances, aging buckets (0–30, 31–60, 61–90, 90+ days) |
| Supplier payables | 1 | Balances and ledger |
| Daily closing / cash book | 1 | Per branch per day |
| Expenses | 1 | By category |
| Purchases | 2 | By supplier/product/period |
| Installments | 2 | Outstanding, collected, overdue, defaulted |
| Returns & warranty | 2 | Returns by reason, claims by status |
| Trade-in | 2 | Units bought, sold, margin |
| Stock movement | 2 | Ledger per variant/unit |
| IMEI sold register | 2 | Sold IMEIs with customer details (for police/BTRC inquiries) |
| Staff performance | 2 | Sales and profit per salesperson |
| Income statement (simple) | 2 | Sales − COGS − expenses = net profit |

---

## M13. SMS — Phase 2

**Stories**
- SMS-01: As an owner, I enable SMS types: invoice, due reminder, installment reminder, warranty status, and custom bulk message to a customer segment.
- SMS-02: I edit **templates** per type in bn/en with variables (`{customer_name}`, `{invoice_no}`, `{amount}`, `{due}`, `{due_date}`, `{shop_name}`, `{shop_phone}`).
- SMS-03: I see my **SMS balance** (credits from my plan plus purchased top-ups) and the SMS log with delivery status.
- SMS-04: I buy SMS top-ups via the billing flow ([06](06-saas-billing.md#sms-credits)).

**Rules**
- Credits are counted per segment: GSM-7 is 160 chars (153 when multipart), Unicode/Bangla is 70 chars (67 when multipart). A preview shows the segment count before sending.
- Sending is blocked when the balance is insufficient (the transactional SMS fails gracefully and the sale still completes).
- Automatic reminders run in a scheduled job at 10:00 Asia/Dhaka. No SMS goes out between 21:00 and 09:00.
- Gateway details: [08-integrations.md](08-integrations.md#sms).

---

## M14. Users, roles & settings — Phase 1

**Stories**
- USR-01: As an owner, I manage members: invite, set role and branches, disable, reset password.
- USR-02: I create **custom roles** from the permission list ([05](05-roles-permissions.md)) and set role limits (max discount %, can see cost/profit).
- USR-03: Each member can set a 4–6 digit **approval PIN** used for manager overrides on the POS.
- SET-01: Shop settings: profile, logo, language default, invoice template options, receipt footer, warranty/return terms, VAT, return window, cash-difference threshold, payment methods (enable/disable/custom, mapped to money accounts), expense categories, number format (Bangla/English digits).
- SET-02: Data export: the owner can export all tenant data (CSV zip) at any time.
- AUD-01: As an owner, I view the **audit log** with filters by user, entity and date.

---

## M15. Platform admin (SaaS operator) — Phase 3

**Stories**
- ADM-01: As a platform admin, I see all tenants: status (trial/active/past-due/suspended/cancelled), plan, renewal date, usage (branches, users, products, SMS), last activity.
- ADM-02: I create a tenant manually (for assisted onboarding like the pilot), set its plan, extend a trial, and give a discount or a free period.
- ADM-03: I manage **plans** and their limits/prices ([06](06-saas-billing.md)).
- ADM-04: I see **subscription payments**, approve **manual payments** (bKash send-money with a TrxID), and issue refunds.
- ADM-05: I **suspend/unsuspend** a tenant, and record the reason.
- ADM-06: I **impersonate** a tenant member for support. Read-only by default, with every impersonated action audited and a banner shown.
- ADM-07: I manage the platform SMS gateway credentials, and SMS top-up packages and pricing.
- ADM-08: I post **announcements** shown in tenant dashboards.

**Rules**
- Platform admins are separate from tenant members (`User.isPlatformAdmin`), and admin routes live under `/admin`.

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | POS scan → line added < 300 ms p95; page TTFB < 500 ms p95 on 4G; reports < 3 s for 1 year of one tenant's data |
| Scale (design target) | 1,000 tenants, 50k invoices/tenant/year, 5 concurrent counters per tenant |
| Availability | 99.5% monthly; daily DB backups kept 30 days + point-in-time recovery |
| Security | See [03 § Security](03-architecture.md#security) |
| Browsers | Latest Chrome/Edge (counter PCs), Chrome Android (owners). The POS is optimized for 1366×768 and up; the dashboard and reports are responsive down to 360 px |
| Accessibility | Keyboard-operable POS, visible focus, color contrast AA |
| Data ownership | The tenant can export all data; data is retained 90 days after cancellation, then deleted |
