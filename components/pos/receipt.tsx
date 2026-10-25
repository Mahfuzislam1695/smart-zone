import { formatDate, formatMoney, formatNumber, toLocaleDigits } from "@/lib/format";
import type { Locale } from "@/lib/locales";

export type ReceiptData = {
  invoice: string;
  date: string;
  customer: { name: string; phone: string } | null;
  lines: { name: string; imei: string | null; qty: number; price: number; warrantyMonths: number }[];
  subtotal: number;
  discount: number;
  total: number;
  payments: { label: string; amount: number }[];
  due: number;
  change: number;
};

type ReceiptDict = {
  invoice: string;
  date: string;
  customer: string;
  warranty: string;
  months: string;
  thanks: string;
  terms: string;
};

/** 80mm thermal invoice (72mm printable). Monochrome on purpose: thermal printers print black only. */
export function Receipt({
  data,
  dict,
  locale,
  shop,
  subtotalLabel,
  discountLabel,
  totalLabel,
  paidLabel,
  dueLabel,
  changeLabel,
}: {
  data: ReceiptData;
  dict: ReceiptDict;
  locale: Locale;
  shop: { name: string; address: string; phone: string };
  subtotalLabel: string;
  discountLabel: string;
  totalLabel: string;
  paidLabel: string;
  dueLabel: string;
  changeLabel: string;
}) {
  const money = (p: number) => formatMoney(p, locale);
  const rule = <p className="my-2 border-t border-dashed border-black/50" />;
  const row = (label: string, value: string, strong = false) => (
    <p className={`flex justify-between gap-2 ${strong ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="nums">{value}</span>
    </p>
  );

  return (
    <div className="print-area mx-auto w-[72mm] max-w-full bg-white px-3 py-4 font-mono text-[11px] leading-snug text-black">
      <p className="text-center font-sans text-[14px] font-bold">{shop.name}</p>
      <p className="text-center font-sans">{shop.address}</p>
      <p className="text-center">{toLocaleDigits(shop.phone, locale)}</p>
      {rule}
      {row(dict.invoice, data.invoice)}
      {row(dict.date, formatDate(data.date, locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}
      {data.customer && row(dict.customer, `${data.customer.name} ${toLocaleDigits(data.customer.phone, locale)}`)}
      {rule}
      {data.lines.map((l, i) => (
        <div key={i} className="mb-1.5">
          <p className="font-sans font-semibold">{l.name}</p>
          {l.imei && <p>IMEI {l.imei}</p>}
          <p className="flex justify-between">
            <span className="nums">
              {formatNumber(l.qty, locale)} × {money(l.price)}
            </span>
            <span className="nums">{money(l.qty * l.price)}</span>
          </p>
          {l.warrantyMonths > 0 && (
            <p className="font-sans">
              {dict.warranty}: {formatNumber(l.warrantyMonths, locale)} {dict.months}
            </p>
          )}
        </div>
      ))}
      {rule}
      {row(subtotalLabel, money(data.subtotal))}
      {data.discount > 0 && row(discountLabel, `−${money(data.discount)}`)}
      {row(totalLabel, money(data.total), true)}
      {data.payments.map((p) => row(p.label, money(p.amount)))}
      {row(paidLabel, money(data.payments.reduce((s, p) => s + p.amount, 0)))}
      {data.change > 0 && row(changeLabel, money(data.change))}
      {data.due > 0 && row(dueLabel, money(data.due), true)}
      {rule}
      <p className="text-center font-sans">{dict.terms}</p>
      <p className="mt-2 text-center font-sans font-semibold">{dict.thanks}</p>
    </div>
  );
}
