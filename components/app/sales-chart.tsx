import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locales";

/** Server-rendered bar chart of daily sales. Today's bar is solid ink; earlier days are tinted. */
export function SalesChart({ series, endDate, locale }: { series: number[]; endDate: string; locale: Locale }) {
  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const max = Math.max(...series);
  const step = niceStep(max / 3);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const slot = innerW / series.length;
  const barW = Math.max(4, slot * 0.62);
  const end = new Date(endDate);
  const dayOf = (i: number) => new Date(end.getTime() - (series.length - 1 - i) * 86_400_000);

  // Axis labels in lakh (১ লাখ = ৳1,00,000 = 1e7 paisa) keep the y-axis short.
  const lakh = (paisa: number) =>
    paisa === 0 ? formatNumber(0, locale) : `${formatNumber(paisa / 1e7, locale)}${locale === "bn" ? " লাখ" : "L"}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Sales chart">
      {ticks.map((t) => {
        const y = pad.top + innerH - (t / top) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="var(--rule)" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-[var(--muted-fg)] text-[11px]">
              {lakh(t)}
            </text>
          </g>
        );
      })}
      {series.map((v, i) => {
        const h = (v / top) * innerH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        const isToday = i === series.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={pad.top + innerH - h}
            width={barW}
            height={h}
            rx={2}
            fill={isToday ? "var(--ink)" : "color-mix(in oklab, var(--ink) 32%, transparent)"}
          >
            <title>{`${formatDate(dayOf(i), locale, { day: "numeric", month: "short" })}: ${formatMoney(v, locale)}`}</title>
          </rect>
        );
      })}
      {[0, Math.floor(series.length / 2), series.length - 1].map((i) => (
        <text
          key={i}
          x={pad.left + i * slot + slot / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-[var(--muted-fg)] text-[11px]"
        >
          {formatDate(dayOf(i), locale, { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  );
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
