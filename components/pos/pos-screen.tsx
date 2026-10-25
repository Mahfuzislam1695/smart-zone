"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, ScanBarcode, Trash2, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { LangSwitch } from "@/components/lang-switch";
import { Kbd } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { PosProduct } from "@/lib/demo-data";
import { formatDate, formatImei, formatMoney, formatNumber, parseTaka, toLocaleDigits } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { Receipt, type ReceiptData } from "./receipt";

type PosDict = Dictionary["pos"];
type MethodKey = keyof PosDict["methods"];
type Line = PosProduct & { qty: number };
type Payment = { method: MethodKey; amount: number };
type Customer = { id: string; name: { bn: string; en: string }; phone: string; previousDue: number };

const METHOD_KEYS: { method: MethodKey; key: string }[] = [
  { method: "cash", key: "F2" },
  { method: "bkash", key: "F3" },
  { method: "nagad", key: "F4" },
  { method: "card", key: "F5" },
];

export function PosScreen({
  dict,
  lang,
  locale,
  catalog,
  customers,
  shop,
  cashierName,
}: {
  dict: PosDict;
  lang: Dictionary["lang"];
  locale: Locale;
  catalog: PosProduct[];
  customers: Customer[];
  shop: { name: string; address: string; phone: string };
  cashierName: string;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [discountInput, setDiscountInput] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [seq, setSeq] = useState(1854);

  const scanRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLSelectElement>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const money = (p: number) => formatMoney(p, locale);
  const customer = customers.find((c) => c.id === customerId) ?? null;

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = Math.min(parseTaka(discountInput), subtotal);
  const total = subtotal - discount;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const due = Math.max(0, total - paid);
  const change = Math.max(0, paid - total);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || /^\d+$/.test(q)) return [];
    return catalog.filter((p) => `${p.name} ${p.variant}`.toLowerCase().includes(q)).slice(0, 6);
  }, [query, catalog]);

  function flash(tone: "error" | "ok", text: string) {
    clearTimeout(messageTimer.current);
    setMessage({ tone, text });
    messageTimer.current = setTimeout(() => setMessage(null), 2600);
  }

  function focusScan() {
    requestAnimationFrame(() => scanRef.current?.focus());
  }

  function addProduct(p: PosProduct) {
    if (p.kind === "unit" && lines.some((l) => l.code === p.code)) {
      flash("error", dict.alreadyInCart);
      return;
    }
    setLines((prev) => {
      const i = prev.findIndex((l) => l.code === p.code);
      if (i >= 0 && p.kind === "qty") return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...p, qty: 1 }];
    });
    flash("ok", `${dict.added}: ${p.name}`);
    setQuery("");
    focusScan();
  }

  function submitScan() {
    const raw = query.trim();
    if (!raw) return;
    const digits = raw.replace(/[\s-]/g, "");
    const exact = catalog.find((p) => p.code === digits);
    if (exact) return addProduct(exact);
    if (suggestions.length === 1) return addProduct(suggestions[0]);
    if (suggestions.length === 0) flash("error", dict.notFound);
  }

  function addPayment(method: MethodKey) {
    const remaining = total - paid;
    if (remaining <= 0) return;
    setPayments((prev) => {
      const i = prev.findIndex((p) => p.method === method);
      if (i >= 0) return prev.map((p, j) => (j === i ? { ...p, amount: p.amount + remaining } : p));
      return [...prev, { method, amount: remaining }];
    });
  }

  function resetCart() {
    setLines([]);
    setPayments([]);
    setDiscountInput("");
    setCustomerId("");
    setQuery("");
  }

  function hold() {
    if (lines.length === 0) return;
    resetCart();
    flash("ok", dict.held);
    focusScan();
  }

  function complete() {
    if (lines.length === 0) return flash("error", dict.cartEmpty);
    if (due > 0 && !customer) {
      flash("error", dict.dueNeedsCustomer);
      customerRef.current?.focus();
      return;
    }
    setReceipt({
      invoice: `MN-26-${String(seq).padStart(6, "0")}`,
      date: new Date().toISOString(),
      customer: customer ? { name: customer.name[locale], phone: customer.phone } : null,
      lines: lines.map((l) => ({
        name: `${l.name} ${l.variant}`,
        imei: l.kind === "unit" ? l.code : null,
        qty: l.qty,
        price: l.price,
        warrantyMonths: l.warrantyMonths,
      })),
      subtotal,
      discount,
      total,
      payments: payments.map((p) => ({ label: dict.methods[p.method], amount: p.amount })),
      due,
      change,
    });
  }

  function newSale() {
    setReceipt(null);
    setSeq((n) => n + 1);
    resetCart();
    focusScan();
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (receipt) return;
    const map: Record<string, () => void> = {
      F1: focusScan,
      F2: () => addPayment("cash"),
      F3: () => addPayment("bkash"),
      F4: () => addPayment("nagad"),
      F5: () => addPayment("card"),
      F6: hold,
      F9: complete,
      F10: () => customerRef.current?.focus(),
    };
    const action = map[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    scanRef.current?.focus();
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:h-dvh">
      {/* Slim top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-surface px-3 sm:px-4">
        <Link
          href={`/${locale}/dashboard`}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-ui text-muted hover:bg-surface-2 hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{dict.exit}</span>
        </Link>
        <LogoMark className="size-7" />
        <p className="hidden text-ui font-medium md:block">{shop.name}</p>
        <div className="ml-auto flex items-center gap-3 text-2xs text-muted">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="size-2 rounded-full bg-paid" aria-hidden />
            {dict.session}
          </span>
          <span className="hidden sm:inline">
            {dict.cashier}: <span className="text-fg">{cashierName}</span>
          </span>
          <LangSwitch locale={locale} label={lang.label} aria={lang.aria} />
        </div>
      </header>

      <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[1fr_400px]">
        {/* Left: scan + cart */}
        <section className="flex min-h-0 flex-col">
          <div className="relative border-b border-rule bg-surface p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitScan();
              }}
              className="relative"
            >
              <ScanBarcode className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink" />
              <input
                ref={scanRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.scanPlaceholder}
                autoComplete="off"
                aria-label={dict.scanPlaceholder}
                className="h-14 w-full rounded-md border-2 border-ink/40 bg-paper pl-12 pr-16 text-body focus-visible:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/15"
              />
              <Kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">F1</Kbd>
            </form>

            {suggestions.length > 0 && (
              <ul className="absolute inset-x-3 top-[calc(100%-0.5rem)] z-20 overflow-hidden rounded-md border border-rule bg-surface shadow-lift sm:inset-x-4">
                {suggestions.map((p) => (
                  <li key={p.code}>
                    <button
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-ui hover:bg-ink-soft"
                    >
                      <span>
                        {p.name} <span className="text-muted">{p.variant}</span>
                      </span>
                      <span className="nums font-medium">{money(p.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p
              role="status"
              className={cn(
                "mt-2 h-5 text-2xs",
                message?.tone === "error" ? "text-due" : "text-paid",
              )}
            >
              {message?.text}
            </p>
          </div>

          {/* Cart */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center lg:h-full">
                <ScanBarcode className="size-10 text-ink/40" strokeWidth={1.5} />
                <p className="mt-3 text-body font-medium">{dict.empty}</p>
                <p className="mt-1 max-w-sm text-ui text-muted">{dict.emptyHint}</p>
              </div>
            ) : (
              <table className="w-full text-ui">
                <thead className="sticky top-0 bg-paper text-left text-2xs text-muted">
                  <tr className="border-b border-rule">
                    <th className="w-8 px-3 py-2 font-medium sm:px-4">#</th>
                    <th className="px-2 py-2 font-medium">{dict.item}</th>
                    <th className="px-2 py-2 text-center font-medium">{dict.qty}</th>
                    <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">{dict.price}</th>
                    <th className="px-2 py-2 text-right font-medium">{dict.total}</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule bg-surface">
                  {lines.map((l, i) => (
                    <tr key={l.code}>
                      <td className="nums px-3 py-3 text-muted sm:px-4">{formatNumber(i + 1, locale)}</td>
                      <td className="px-2 py-3">
                        <p className="font-medium">
                          {l.name} <span className="font-normal text-muted">{l.variant}</span>
                        </p>
                        {l.kind === "unit" && (
                          <p className="nums font-mono text-2xs text-muted">IMEI {formatImei(l.code)}</p>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        {l.kind === "qty" ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              aria-label="−1"
                              onClick={() =>
                                setLines((prev) =>
                                  prev.flatMap((x, j) => (j === i ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])),
                                )
                              }
                              className="flex size-7 items-center justify-center rounded border border-rule hover:border-ink"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="nums w-7 text-center">{formatNumber(l.qty, locale)}</span>
                            <button
                              type="button"
                              aria-label="+1"
                              onClick={() => setLines((prev) => prev.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))}
                              className="flex size-7 items-center justify-center rounded border border-rule hover:border-ink"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="nums text-center">{formatNumber(1, locale)}</p>
                        )}
                      </td>
                      <td className="nums hidden px-2 py-3 text-right text-muted sm:table-cell">{money(l.price)}</td>
                      <td className="nums px-2 py-3 text-right font-medium">{money(l.price * l.qty)}</td>
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          aria-label={dict.remove}
                          onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-due-soft hover:text-due"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Demo codes */}
          <div className="border-t border-rule bg-surface px-3 py-3 sm:px-4">
            <p className="text-2xs text-muted">
              {dict.demoCodes} <span className="text-muted/70">({dict.demoNote})</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {catalog.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="rounded-md border border-rule px-2 py-1 text-2xs hover:border-ink hover:text-ink"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: customer, totals, payments */}
        <aside className="flex flex-col border-t border-rule bg-surface lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="border-b border-rule p-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="pos-customer" className="text-2xs font-medium">
                {dict.customer}
              </label>
              <Kbd className="text-muted">F10</Kbd>
            </div>
            <select
              id="pos-customer"
              ref={customerRef}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-rule-strong bg-paper px-3 text-ui focus-visible:border-ink focus-visible:outline-none"
            >
              <option value="">{dict.walkIn}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[locale]} — {toLocaleDigits(c.phone, locale)}
                </option>
              ))}
            </select>
            {customer && customer.previousDue > 0 && (
              <p className="mt-2 text-2xs text-muted">
                {dict.previousDue}: <span className="nums font-semibold text-due">{money(customer.previousDue)}</span>
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <dl className="space-y-2 text-ui">
              <div className="flex justify-between">
                <dt className="text-muted">{dict.subtotal}</dt>
                <dd className="nums">{money(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">
                  <label htmlFor="pos-discount">{dict.discount}</label>
                </dt>
                <dd>
                  <input
                    id="pos-discount"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    inputMode="decimal"
                    placeholder="৳0"
                    className="nums h-8 w-28 rounded-md border border-rule-strong bg-paper px-2 text-right text-ui focus-visible:border-ink focus-visible:outline-none"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-rule pt-3">
                <dt className="font-medium">{dict.grandTotal}</dt>
                <dd className="nums font-display text-h3 font-bold">{money(total)}</dd>
              </div>
            </dl>

            <p className="mt-5 text-2xs font-medium">{dict.payments}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {METHOD_KEYS.map(({ method, key }) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => addPayment(method)}
                  disabled={lines.length === 0}
                  className="flex h-11 items-center justify-between rounded-md border border-rule-strong px-3 text-ui font-medium hover:border-ink hover:text-ink disabled:opacity-40"
                >
                  {dict.methods[method]}
                  <Kbd className="text-muted">{key}</Kbd>
                </button>
              ))}
            </div>

            {payments.length === 0 ? (
              <p className="mt-3 text-2xs text-muted">{dict.noPayments}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {payments.map((p, i) => (
                  <li key={p.method} className="flex items-center gap-2">
                    <span className="w-16 text-ui">{dict.methods[p.method]}</span>
                    <input
                      value={String(p.amount / 100)}
                      onChange={(e) => {
                        const amount = parseTaka(e.target.value);
                        setPayments((prev) => prev.map((x, j) => (j === i ? { ...x, amount } : x)));
                      }}
                      inputMode="decimal"
                      aria-label={dict.methods[p.method]}
                      className="nums h-9 min-w-0 flex-1 rounded-md border border-rule-strong bg-paper px-2 text-right text-ui focus-visible:border-ink focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={dict.remove}
                      onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))}
                      className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-2"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-4 space-y-1.5 text-ui">
              <div className="flex justify-between">
                <dt className="text-muted">{dict.paid}</dt>
                <dd className="nums">{money(paid)}</dd>
              </div>
              {change > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{dict.change}</dt>
                  <dd className="nums font-medium text-paid">{money(change)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className={cn(due > 0 ? "font-medium text-due" : "text-muted")}>{dict.due}</dt>
                <dd className={cn("nums", due > 0 && "font-semibold text-due")}>{money(due)}</dd>
              </div>
            </dl>
            {due > 0 && lines.length > 0 && !customer && (
              <p className="mt-2 rounded-md bg-due-soft px-3 py-2 text-2xs text-due">{dict.dueNeedsCustomer}</p>
            )}
          </div>

          <div className="space-y-2 border-t border-rule p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={hold}>
                {dict.hold} <Kbd className="text-muted">F6</Kbd>
              </Button>
              <Button variant="secondary" disabled title={dict.tradeIn}>
                {dict.tradeIn} <Kbd className="text-muted">F8</Kbd>
              </Button>
            </div>
            <Button size="lg" className="h-14 w-full text-h5" onClick={complete}>
              {dict.pay}
              <Kbd className="border-white/40 text-white">F9</Kbd>
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={receipt !== null} onClose={newSale} labelledBy="receipt-title" className="w-[22rem]">
        {receipt && (
          <div className="p-5">
            <p id="receipt-title" className="font-display text-h5 font-semibold text-paid">
              {dict.receipt.title}
            </p>
            <div className="mt-4 max-h-[60dvh] overflow-y-auto rounded-md bg-surface-2 p-3">
              <Receipt data={receipt} dict={dict.receipt} locale={locale} shop={shop} dueLabel={dict.due} paidLabel={dict.paid} totalLabel={dict.grandTotal} discountLabel={dict.discount} subtotalLabel={dict.subtotal} changeLabel={dict.change} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                {dict.receipt.print}
              </Button>
              <Button onClick={newSale}>{dict.receipt.newSale}</Button>
            </div>
            <p className="mt-3 text-center text-2xs text-muted">
              {formatDate(receipt.date, locale, { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
