import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold tracking-[0.01em] transition-[border-color,background-color,color,opacity] duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      active: {
        true: "",
        false: "",
      },
      intent: {
        primary:
          "border-accent/60 bg-accent-soft text-fg hover:border-accent hover:bg-accent/18",
        secondary:
          "border-border-default bg-elevated text-fg-secondary hover:border-accent/40 hover:bg-elevated hover:text-fg",
        ghost:
          "border-transparent bg-transparent text-fg-secondary hover:bg-elevated/80 hover:text-fg",
      },
      size: {
        sm: "min-h-10 px-4",
        md: "min-h-11 px-4 sm:px-5",
      },
    },
    compoundVariants: [
      {
        active: true,
        intent: "secondary",
        className: "border-accent/70 bg-accent-soft text-fg",
      },
      {
        active: true,
        intent: "ghost",
        className: "bg-elevated text-fg",
      },
    ],
    defaultVariants: {
      active: false,
      intent: "secondary",
      size: "md",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export default function Button({
  active,
  className,
  intent,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ active, intent, size }), className)} {...props} />;
}
