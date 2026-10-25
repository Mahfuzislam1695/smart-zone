import { cn } from "@/lib/cn";

/** Decorative barcode drawn from a digit string. Not scannable; for illustrations only. */
export function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const pattern = `11${value}11`;
  for (let i = 0; i < pattern.length; i++) {
    const d = Number(pattern[i]) || 0;
    const w = 1 + (d % 3);
    const gap = 1 + ((d + i) % 2);
    bars.push({ x, w });
    x += w + gap;
  }
  return (
    <svg viewBox={`0 0 ${x} 20`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="20" fill="currentColor" />
      ))}
    </svg>
  );
}
