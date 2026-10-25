import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-rule-strong bg-surface px-3 text-ui text-fg placeholder:text-muted/80",
        "focus-visible:border-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/20",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-2xs font-medium text-fg", className)} {...props} />;
}
