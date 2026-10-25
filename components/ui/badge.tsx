import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium leading-none", {
  variants: {
    tone: {
      neutral: "bg-surface-2 text-muted",
      ink: "bg-ink-soft text-ink",
      paid: "bg-paid-soft text-paid",
      due: "bg-due-soft text-due",
      warn: "bg-warn-soft text-warn",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-current/25 px-1 font-sans text-[11px] leading-none opacity-80",
        className,
      )}
      {...props}
    />
  );
}
