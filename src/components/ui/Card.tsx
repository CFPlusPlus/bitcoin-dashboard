import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import Surface, { type SurfaceProps } from "./Surface";

const cardVariants = cva("flex flex-col", {
  variants: {
    gap: {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    },
  },
  defaultVariants: {
    gap: "md",
  },
});

type CardProps = Omit<SurfaceProps, "children"> &
  VariantProps<typeof cardVariants> & {
    children: ReactNode;
  };

export default function Card({
  children,
  className,
  gap,
  ...props
}: CardProps) {
  return (
    <Surface className={cn(cardVariants({ gap }), className)} {...props}>
      {children}
    </Surface>
  );
}
