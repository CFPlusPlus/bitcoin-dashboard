import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      xs: "gap-1.5",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
    },
  },
  defaultVariants: {
    gap: "md",
  },
});

type StackProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stackVariants> & {
    children: ReactNode;
  };

export default function Stack({
  children,
  className,
  gap,
  ...props
}: StackProps) {
  return (
    <div className={cn(stackVariants({ gap }), className)} {...props}>
      {children}
    </div>
  );
}
