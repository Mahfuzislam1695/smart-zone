"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, PackageCheck, ShieldCheck } from "lucide-react";
import { Barcode } from "@/components/marketing/barcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DemoUnit } from "@/lib/demo-data";
import { formatDate, formatImei, formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locales";

type DemoDict = {
  label: string;
  placeholder: string;
  scan: string;
  hint: string;
  notFound: string;
  tryThis: string;
  statusSold: string;
  statusInStock: string;
  profit: string;
  receiptTitle: string;
  receiptThanks: string;
  receiptDue: string;
  receiptPaid: string;
};

const eventIcon = { purchase: PackageCheck, sale: CircleCheck, warranty: ShieldCheck };

export function ImeiDemo({
  dict,
  locale,
  units,
  shopName,
}: {
  dict: DemoDict;
  locale: Locale;
  units: DemoUnit[];
  shopName: string;
}) {
  const [value, setValue] = useState(units[0].imei);
  // Starts in "scanning": the page-load moment scans the demo IMEI once on arrival.
  const [phase, setPhase] = useState<"scanning" | "done">("scanning");
  const [result, setResult] = useState<DemoUnit | null>(null);
  const [runId, setRunId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function scan(code: string, delay = 650) {
    clearTimeout(timer.current);
    const digits = code.replace(/\D/g, "");
    setPhase("scanning");
    timer.current = setTimeout(() => {
      setResult(units.find((u) => u.imei === digits) ?? null);
      setPhase("done");
      setRunId((n) => n + 1);
    }, delay);
  }

  useEffect(() => {
    timer.current = setTimeout(() => {
      setResult(units[0]);
      setPhase("done");
      setRunId((n) => n + 1);
    }, 900);
    return () => clearTimeout(timer.current);
  }, [units]);

  const money = (p: number) => formatMoney(p, locale);

  return (
    <div className="relative">
      <div className="rounded-lg border border-rule bg-surface shadow-lift">
        {/* Box-label style scan area */}
        <form
          className="border-b border-dashed border-rule-strong p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            scan(value);
          }}
        >
          <label htmlFor="demo-imei" className="text-2xs font-medium text-muted">
            {dict.label}
          </label>
          <div className="relative mt-2 overflow-hidden text-fg/80">
            <Barcode value={value.replace(/\D/g, "").padEnd(15, "0").slice(0, 15)} />
            {phase === "scanning" && <span className="anim-laser absolute inset-x-0 top-1/2 h-0.5 bg-due" aria-hidden />}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              id="demo-imei"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder={dict.placeholder}
              className="nums h-11 min-w-0 flex-1 rounded-md border border-rule-strong bg-paper px-3 font-mono text-ui tracking-wide focus-visible:border-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/20"
            />
            <Button type="submit" size="lg" className="h-11 px-5">
              {dict.scan}
            </Button>
          </div>
          <p className="mt-2 text-2xs text-muted">{dict.hint}</p>
        </form>

        {/* Result */}
        <div className="min-h-64 p-4 sm:p-5" aria-live="polite">
          {phase === "done" && result && (
            <div key={runId}>
              <div className="anim-row flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-display text-h5 font-semibold leading-tight">{result.model}</p>
                  <p className="text-2xs text-muted">
                    {result.variant} <span className="nums font-mono">{formatImei(result.imei)}</span>
                  </p>
                </div>
                <Badge tone={result.status === "sold" ? "ink" : "paid"}>
                  {result.status === "sold" ? dict.statusSold : dict.statusInStock}
                </Badge>
              </div>

              <ol className="mt-4 space-y-3">
                {result.events.map((ev, i) => {
                  const Icon = eventIcon[ev.kind];
                  return (
                    <li key={i} className="anim-row flex gap-3" style={{ animationDelay: `${180 + i * 220}ms` }}>
                      <Icon className={cn("mt-0.5 size-4 shrink-0", ev.kind === "warranty" ? "text-warn" : "text-ink")} />
                      <div className="text-ui leading-snug">
                        <span className="nums text-2xs text-muted">{formatDate(ev.date, locale)}</span>
                        <p>{ev.text[locale]}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {result.price && (
                <p
                  className="anim-row mt-4 flex items-center justify-between rounded-md bg-paid-soft px-3 py-2 text-ui"
                  style={{ animationDelay: `${180 + result.events.length * 220}ms` }}
                >
                  <span className="text-paid">{dict.profit}</span>
                  <span className="nums font-semibold text-paid">{money(result.price - result.cost)}</span>
                </p>
              )}
            </div>
          )}

          {phase === "done" && !result && (
            <div className="anim-row text-ui">
              <p>{dict.notFound}</p>
              <p className="mt-3 text-2xs text-muted">{dict.tryThis}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {units.map((u) => (
                  <button
                    key={u.imei}
                    type="button"
                    onClick={() => {
                      setValue(u.imei);
                      scan(u.imei);
                    }}
                    className="nums rounded-md border border-rule-strong px-2 py-1 font-mono text-2xs hover:border-ink hover:text-ink"
                  >
                    {u.imei}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thermal receipt that "prints" out from under the card */}
      {phase === "done" && result?.invoice && result.price && result.paid !== undefined && (
        <div
          key={`r${runId}`}
          className="anim-print receipt-edge relative mx-auto -mt-2 w-[min(17rem,85%)] bg-receipt px-4 pb-6 pt-4 font-mono text-[11px] leading-relaxed text-[#1b1b1b] shadow-lift lg:absolute lg:-right-8 lg:top-[calc(100%-1.25rem)] lg:mt-0 lg:w-60 lg:rotate-2"
          style={{ animationDelay: `${300 + result.events.length * 220}ms` }}
          aria-hidden
        >
          <p className="text-center font-sans text-[12px] font-semibold">{shopName}</p>
          <p className="mt-1 text-center">
            {dict.receiptTitle} {result.invoice}
          </p>
          <p className="my-1.5 border-t border-dashed border-black/40" />
          <p>
            {result.model} {result.variant}
          </p>
          <p>IMEI {result.imei}</p>
          <p className="my-1.5 border-t border-dashed border-black/40" />
          <p className="flex justify-between">
            <span>{dict.receiptPaid}</span>
            <span>{money(result.paid)}</span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>{dict.receiptDue}</span>
            <span>{money(result.price - result.paid)}</span>
          </p>
          <p className="mt-2 text-center">{dict.receiptThanks}</p>
        </div>
      )}
    </div>
  );
}
