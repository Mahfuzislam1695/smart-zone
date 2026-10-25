# 06 — SaaS Billing

## Plans

Prices are **proposals** for the platform owner to finalize. They're stored in the `Plan` table, so they can change without a deploy.

| | **Starter** | **Growth** | **Pro** |
|---|---|---|---|
| Monthly (BDT) | ৳799 | ৳1,499 | ৳2,999 |
| Yearly (BDT, ≈2 months free) | ৳7,990 | ৳14,990 | ৳29,990 |
| Branches | 1 | 3 | 10 |
| Users | 3 | 10 | 30 |
| Variants (products) | 1,000 | 10,000 | unlimited |
| SMS credits / month | 100 | 500 | 1,500 |
| Installments (EMI) | ✓ | ✓ | ✓ |
| Trade-in, warranty | ✓ | ✓ | ✓ |
| Stock transfers | — | ✓ | ✓ |
| Custom roles | — | ✓ | ✓ |
| Full reports + CSV export | basic | ✓ | ✓ |
| Audit log | — | ✓ | ✓ |
| Priority support | — | — | ✓ |

Feature flags (`Plan.features`): `transfers`, `customRoles`, `fullReports`, `export`, `auditLog`, `prioritySupport`, `customDomain` (Phase 4).

**Limit enforcement:** the service layer checks the limits on create (branch, member invite, variant). Exceeding one returns `PLAN_LIMIT` with an upgrade prompt. Downgrading is allowed only if current usage fits the new plan's limits. Otherwise the UI lists what to archive first.

## Lifecycle

```
signup ──► TRIALING (14 days, Growth features, 50 SMS)
              │ pays                      │ trial ends unpaid
              ▼                           ▼
           ACTIVE ◄──── pays ──────── PAST_DUE (7-day grace, full access + banner)
              │ period ends unpaid         │ grace ends unpaid
              └──────────► PAST_DUE        ▼
                                       SUSPENDED (read-only) ── 90 days ──► CANCELLED (data deleted after export window)
```

- `Subscription.status` is the billing state. `Tenant.status` is the **access state** derived from it by the daily `subscriptions` job ([03](03-architecture.md#background-jobs)): TRIALING→TRIAL, ACTIVE→ACTIVE, PAST_DUE→PAST_DUE, and after the grace period SUSPENDED.
- Reminder SMS and in-app banners go out 7, 3 and 1 days before the period ends, and on each day of grace.
- The pilot tenant is created by a platform admin with a manual plan, discount or free period (ADM-02).

## Suspension

A suspended tenant's members can log in, view and print everything, and export data. **All writes are blocked**: `requireWritable(ctx)` throws `TENANT_READ_ONLY` in every mutating action. The only allowed write is paying the subscription. This keeps the shop's data safe and visible, which builds trust, while still creating pressure to pay.

## Payment providers

All subscription payments go through `server/payments/` adapters ([08](08-integrations.md#payments)).

| Provider | Phase | Flow |
|----------|-------|------|
| **Manual bKash/Nagad** | 1 (pilot) | The owner sends money to the platform's merchant number, then submits the TrxID and payer number in the app. This creates `BillingPayment(MANUAL, PENDING)`. A platform admin verifies it in the bKash/Nagad merchant panel and approves it, which marks it PAID and extends the period |
| **SSLCommerz** | 3 | Hosted checkout (cards, bKash, Nagad, Rocket, internet banking). Create session → redirect → IPN webhook → **server-side validation API call** → mark PAID |
| **bKash Tokenized Checkout** (direct) | 3+ | Lower fees for bKash-heavy customers. Create payment → bKash page → callback → execute → query status → mark PAID |

**Rules:**
- Never mark a payment PAID from a browser redirect alone. Always confirm server-to-server (IPN validation or status query).
- `@@unique([provider, providerTxnId])` makes webhook processing idempotent.
- On PAID: extend `currentPeriodEnd` from `max(now, currentPeriodEnd)` by the interval, set ACTIVE, grant the month's SMS credits (`SmsCreditEntry PLAN_GRANT`), generate an invoice number `SZ-{YYYY}-{seq}`, and email/SMS the receipt.
- Plan change mid-period: an upgrade takes effect immediately, with the price difference prorated by remaining days. A downgrade takes effect at period end.
- Refunds are manual, done by a platform admin. They're recorded as `REFUNDED` and the period is adjusted.

## SMS credits

- Each plan grants monthly credits on renewal. Unused plan credits **expire** at the next renewal, and purchased top-ups never expire. Usage consumes plan credits first.
- Top-up packages (admin-configurable), for example 500 SMS ৳250, 1,000 SMS ৳450 and 5,000 SMS ৳2,000, are bought through the same payment flow (`BillingPayment.kind = SMS_TOPUP`).
- Balance = `SUM(SmsCreditEntry.change)`. Each sent message writes `USAGE −segments`, and a message that fails at the gateway writes `REFUND +segments`.

## Invoices for tenants

Every PAID `BillingPayment` has a downloadable invoice (A4, bn/en) with the platform's business details, the tenant's name, the plan, the period, the amount, and the payment method.
