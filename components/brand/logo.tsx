import { cn } from "@/lib/cn";

type Tone = "color" | "white" | "current";

const tones: Record<Tone, { frame: string; phone: string; laser: string; speaker: string }> = {
  color: { frame: "var(--ink)", phone: "var(--ink)", laser: "var(--due)", speaker: "var(--surface)" },
  white: { frame: "#ffffff", phone: "#ffffff", laser: "#ff8a96", speaker: "var(--ink)" },
  current: { frame: "currentColor", phone: "currentColor", laser: "currentColor", speaker: "transparent" },
};

/**
 * Logo mark: a scanner viewfinder framing a phone, crossed by one red line.
 * The line is both the scan laser and the khata margin rule. See docs/13-brand.md.
 */
export function LogoMark({
  className,
  tone = "color",
  title,
}: {
  className?: string;
  tone?: Tone;
  title?: string;
}) {
  const c = tones[tone];
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill="none" stroke={c.frame} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15V9a5 5 0 0 1 5-5h6" />
        <path d="M33 4h6a5 5 0 0 1 5 5v6" />
        <path d="M44 33v6a5 5 0 0 1-5 5h-6" />
        <path d="M15 44H9a5 5 0 0 1-5-5v-6" />
      </g>
      <rect x="15.5" y="10" width="17" height="28" rx="4" fill={c.phone} />
      <rect x="21" y="13" width="6" height="1.8" rx="0.9" fill={c.speaker} />
      <path d="M9.5 24h29" stroke={c.laser} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "color",
  showPos = true,
}: {
  className?: string;
  tone?: Tone;
  showPos?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} className="size-[1.9em]" />
      <span
        className={cn(
          "font-display text-[1.2em] leading-none font-semibold tracking-[-0.01em]",
          tone === "white" ? "text-white" : "text-fg",
        )}
        style={{ fontVariationSettings: '"wdth" 108' }}
      >
        SmartZone
        {showPos && (
          <span className={cn("ml-1 font-normal", tone === "white" ? "text-white/70" : "text-muted")}>POS</span>
        )}
      </span>
    </span>
  );
}
