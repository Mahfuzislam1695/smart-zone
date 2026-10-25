import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-on-ink hover:bg-ink-deep",
        secondary: "border border-rule-strong bg-surface text-fg hover:border-ink hover:text-ink",
        ghost: "text-fg hover:bg-surface-2",
        danger: "bg-due text-white hover:opacity-90",
        onInk: "bg-white text-ink-deep hover:bg-ink-soft",
        link: "h-auto px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-2xs",
        md: "h-10 px-4 text-ui",
        lg: "h-12 px-6 text-body",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** cva only concatenates; merge so callers can override base classes (e.g. `hidden sm:inline-flex`). */
export function buttonVariants(props?: Parameters<typeof buttonStyles>[0]) {
  return cn(buttonStyles(props));
}

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
