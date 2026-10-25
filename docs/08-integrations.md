# 08 — Integrations

All third-party services sit behind small adapter interfaces in `server/<area>/`, so a provider can be swapped without touching features. Provider credentials are **platform-level** env vars. Tenants don't bring their own gateway accounts in v1.

## SMS

```ts
// server/sms/types.ts
export interface SmsProvider {
  name: string
  send(msg: { to: string; body: string; unicode: boolean; senderId?: string }):
    Promise<{ ok: true; providerMsgId: string } | { ok: false; error: string; retryable: boolean }>
  balance?(): Promise<number>           // provider account balance (admin dashboard)
  parseDeliveryReport?(req: Request): Promise<{ providerMsgId: string; status: 'DELIVERED' | 'FAILED' } | null>
}
```

- **Candidates:** BulkSMSBD, SSL Wireless (ISMS), Alpha SMS, Infobip. Pick one primary and keep a second as failover (`SMS_PROVIDER`, `SMS_FALLBACK_PROVIDER`). Each provider's request format, auth and delivery-report format must be verified against its current API docs when implementing.
- **Sender ID:** non-masking (a number) by default. A tenant's masking sender ID (shop name) requires registration with the operator through the provider and is an admin-set field (`settings.sms.senderMasking`).
- **Outbox pattern:** features never call the provider directly. They insert `SmsMessage(status=QUEUED)`. The `sms-outbox` job sends in batches, retries retryable failures up to 3 times with backoff, enforces quiet hours (21:00–09:00 Asia/Dhaka, except OTP), and debits credits.
- **OTP** messages are sent immediately (not through the outbox delay) and don't consume tenant credits (platform cost).
- **Segments:** `lib/sms.ts → countSegments(body)` detects GSM-7 vs Unicode: 160/153 chars vs 70/67.
- Delivery reports: `POST /api/webhooks/sms/[provider]` updates `SmsMessage.status`.

## Payments

```ts
// server/payments/types.ts
export interface PaymentProvider {
  name: 'SSLCOMMERZ' | 'BKASH'
  createCheckout(input: { billingPaymentId: string; amount: number; customer: { name: string; phone: string };
    successUrl: string; failUrl: string; cancelUrl: string; ipnUrl: string }): Promise<{ redirectUrl: string }>
  verify(input: { providerTxnId: string; raw: unknown }): Promise<{ paid: boolean; amount: number; providerTxnId: string; raw: unknown }>
}
```

- **SSLCommerz:** session init API → redirect to the gateway page → IPN `POST /api/webhooks/payments/sslcommerz` → call the **Order Validation API** with `val_id` → check that the amount, currency (BDT) and `tran_id` (= our `BillingPayment.id`) match → mark PAID. Use the sandbox (`sandbox.sslcommerz.com`) in dev/staging.
- **bKash Tokenized Checkout:** grant token → create payment → bKash page → callback `GET /api/webhooks/payments/bkash?paymentID=…&status=…` → **execute payment** → if execute is ambiguous, call **query payment** → mark PAID. Tokens expire (cache the grant token server-side until expiry).
- **Manual:** no adapter. An admin approves it in `/admin/billing` ([06](06-saas-billing.md#payment-providers)).
- These gateways are used **only for SaaS subscription billing**. In-store bKash/Nagad payments at the POS are recorded as payment methods with a TrxID. They aren't processed through our gateways in v1.

## Object storage

- S3-compatible API (Cloudflare R2 recommended: no egress fees). Two buckets: `public-assets` (logos, product images) and `private` (NID photos, device photos, expense receipts).
- Uploads: a Server Action issues a pre-signed PUT URL (max 5 MB, image MIME types only), and the client uploads directly. Images are resized client-side to a max of 1600px before upload.
- Private reads use pre-signed GET URLs valid for 5 minutes, issued only after a permission check.

## Email (optional)

Resend or SMTP for owner notifications (billing receipts, trial ending). SMS stays the primary channel.

## Error monitoring

Sentry (`@sentry/nextjs`), configured via `instrumentation.ts`. PII scrubbing is on, and `tenantId`/`userId` are tags.

## Environment variables

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | Postgres (pooled) |
| `DIRECT_DATABASE_URL` | Postgres direct connection for migrations |
| `BETTER_AUTH_SECRET` | Session signing |
| `BETTER_AUTH_URL` | Public base URL |
| `NEXT_PUBLIC_APP_NAME` | White-label product name |
| `NEXT_PUBLIC_APP_URL` | Public base URL (links in SMS, invoice QR) |
| `CRON_SECRET` | Auth for `/api/cron/*` |
| `SMS_PROVIDER`, `SMS_FALLBACK_PROVIDER` | Provider keys |
| `SMS_<PROVIDER>_API_KEY`, `SMS_<PROVIDER>_SENDER_ID`, … | Provider credentials |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX` | SSLCommerz |
| `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_BASE_URL` | bKash tokenized |
| `MANUAL_PAY_BKASH_NUMBER`, `MANUAL_PAY_NAGAD_NUMBER` | Shown on the manual payment screen |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_PUBLIC_BASE_URL` | Storage |
| `RESEND_API_KEY` / `SMTP_URL` | Email (optional) |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Monitoring |
| `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO` | Seeding |

Keep a committed `.env.example` with every key and no values. Validate env at startup with a Zod schema (`lib/env.ts`), so the app fails fast on missing config. See `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` for `NEXT_PUBLIC_` rules.
