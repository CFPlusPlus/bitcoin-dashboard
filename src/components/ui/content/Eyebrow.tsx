import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const eyebrowVariants = cva(
  "font-sans text-[0.72rem] font-normal uppercase leading-[1.2] tracking-[0.16em]",
  {
    variants: {
      tone: {
        accent: "text-accent",
        default: "text-fg-secondary",
        muted: "text-fg-muted",
      },
    },
    defaultVariants: {
      tone: "accent",
    },
  }
);

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof eyebrowVariants> & {
    children: ReactNode;
  };

export default function Eyebrow({ children, className, tone, ...props }: EyebrowProps) {
  return (
    <p className={cn(eyebrowVariants({ tone }), className)} {...props}>
      {children}
    </p>
  );
}
