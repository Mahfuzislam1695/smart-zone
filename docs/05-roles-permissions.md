# 05 — Roles & Permissions

## Model

- A **member** (`Membership`) has exactly one **role** per tenant, and a set of **assigned branches** (`MembershipBranch`).
- A **role** is a list of permission keys (`Role.permissions`) plus two limits: `maxDiscountPct` and `canSeeCost`.
- Three **system roles** are seeded per tenant: **Owner**, **Manager**, **Cashier**.
  - Owner always has all permissions and all branches, and can't be edited or deleted. A tenant always has at least one active Owner.
  - Manager and Cashier can be edited. Owners can create custom roles (e.g. "Salesman", "Accountant").
- **Platform admin** is not a tenant role. It's `User.isPlatformAdmin`, checked only on `/admin` routes and platform services.

## Enforcement

```ts
// lib/permissions.ts — the single source of permission keys
export const PERMISSIONS = [ 'dashboard.view', 'sale.create', /* … */ ] as const
export type PermissionKey = (typeof PERMISSIONS)[number]
```

- Server: `requirePermission(ctx, key)` in every Server Action, Route Handler and page that exposes data ([03](03-architecture.md#authentication)).
- Client: `ctx.permissions` is passed to the shell, to **hide** UI only. Hiding is never the protection.
- Branch scope: any branch-scoped read/write checks `branchId ∈ ctx.branchIds` (Owner = all branches).
- Cost and profit fields (`costPrice`, `unitCost`, `avgCost`, profit columns) are **stripped server-side** from responses unless `role.canSeeCost` (or the `report.profit.view` permission for reports) applies.

## Manager approval (override PIN)

Some actions are allowed for a cashier **with approval**. The POS shows a PIN prompt, and any member present who holds the required permission enters their PIN. The approval is recorded on the document (`approvedById`) and in the audit log. Overrides requiring approval:

| Situation | Approver needs |
|-----------|----------------|
| Discount above own `maxDiscountPct` | `sale.discount.unlimited` or a role with a higher limit |
| Price below `minSalePrice` | `sale.price.override` |
| Due beyond customer's due limit | `sale.due.override` |
| Return outside the return window | `sale.return.override` |
| Void a sale | `sale.void` |
| Cash session closing difference above threshold | `cash.session.approve` |

## Permission keys

| Key | Owner | Manager | Cashier | Notes |
|-----|:-----:|:-------:|:-------:|-------|
| **Dashboard & reports** |
| `dashboard.view` | ✓ | ✓ | ✓ | Cashier sees own figures only (M2) |
| `report.view` | ✓ | ✓ | | Sales/stock/due reports |
| `report.profit.view` | ✓ | | | Profit, cost, margin anywhere |
| `report.export` | ✓ | ✓ | | CSV export, print reports |
| `report.all_branches` | ✓ | | | Consolidated view |
| **Catalog** |
| `catalog.view` | ✓ | ✓ | ✓ | |
| `catalog.manage` | ✓ | ✓ | | Products, variants, categories, brands |
| `catalog.price.edit` | ✓ | ✓ | | Change sale/min/wholesale prices |
| `catalog.import` | ✓ | ✓ | | CSV import |
| **Inventory** |
| `inventory.view` | ✓ | ✓ | ✓ | Stock and unit lookup |
| `inventory.adjust` | ✓ | ✓ | | Adjustments, opening stock |
| `inventory.count` | ✓ | ✓ | | Stock counts |
| `inventory.transfer` | ✓ | ✓ | | Send/receive transfers |
| `inventory.labels.print` | ✓ | ✓ | ✓ | |
| **Purchasing** |
| `purchase.view` | ✓ | ✓ | | |
| `purchase.create` | ✓ | ✓ | | |
| `purchase.void` | ✓ | | | |
| `purchase.return` | ✓ | ✓ | | |
| `supplier.manage` | ✓ | ✓ | | |
| `supplier.payment` | ✓ | ✓ | | |
| **Sales / POS** |
| `sale.create` | ✓ | ✓ | ✓ | |
| `sale.view.all` | ✓ | ✓ | | Without it: own sales only |
| `sale.due.create` | ✓ | ✓ | ✓ | Allow partial payment on credit |
| `sale.due.override` | ✓ | ✓ | | Exceed customer due limit |
| `sale.discount.unlimited` | ✓ | | | Ignore role discount limit |
| `sale.price.override` | ✓ | ✓ | | Below min price |
| `sale.void` | ✓ | ✓ | | Same-day void |
| `sale.return` | ✓ | ✓ | ✓ | Within window |
| `sale.return.override` | ✓ | ✓ | | Outside window |
| `sale.reprint` | ✓ | ✓ | ✓ | |
| `quotation.manage` | ✓ | ✓ | ✓ | |
| **Customers** |
| `customer.view` | ✓ | ✓ | ✓ | |
| `customer.manage` | ✓ | ✓ | ✓ | Create/edit |
| `customer.pii.view` | ✓ | ✓ | | NID number and photos |
| `customer.due.collect` | ✓ | ✓ | ✓ | |
| `customer.due.writeoff` | ✓ | | | |
| **Installments, warranty, trade-in** |
| `installment.create` | ✓ | ✓ | | |
| `installment.collect` | ✓ | ✓ | ✓ | |
| `installment.close` | ✓ | ✓ | | Settle/default/waive |
| `warranty.manage` | ✓ | ✓ | ✓ | |
| `tradein.create` | ✓ | ✓ | | |
| **Cash & expenses** |
| `cash.session.own` | ✓ | ✓ | ✓ | Open/close own session |
| `cash.session.view.all` | ✓ | ✓ | | |
| `cash.session.approve` | ✓ | ✓ | | |
| `cash.inout` | ✓ | ✓ | | Cash in/out, account transfers |
| `expense.create` | ✓ | ✓ | | |
| `expense.void` | ✓ | | | |
| `account.manage` | ✓ | | | Money accounts and payment methods |
| **SMS** |
| `sms.send` | ✓ | ✓ | | Manual and bulk |
| `sms.settings` | ✓ | | | Templates, toggles |
| **Administration** |
| `member.manage` | ✓ | | | Invite, disable, assign role/branches |
| `role.manage` | ✓ | | | Custom roles |
| `branch.manage` | ✓ | | | |
| `settings.manage` | ✓ | | | Shop settings |
| `billing.manage` | ✓ | | | Plan, payments, SMS top-up |
| `audit.view` | ✓ | | | |
| `data.export` | ✓ | | | Full tenant export |

Default limits: Owner `maxDiscountPct = 100, canSeeCost = true`; Manager `20, true`; Cashier `5, false`.

## Platform admin capabilities

`/admin` routes require `user.isPlatformAdmin`. Capabilities: tenant CRUD, plan management, billing payments (approve manual payments, refunds), suspension, impersonation (read-only by default, writes need explicit "allow write" toggle per session, all audited), SMS gateway settings, announcements, usage dashboard. Admins never appear as tenant members.
