import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import Label from "../content/Label";
import Surface, { type SurfaceProps } from "../Surface";

const dashboardPanelVariants = cva("flex h-full flex-col gap-4 overflow-hidden", {
  variants: {
    tone: {
      default: "border-border-default bg-surface",
      muted: "border-border-default bg-muted-surface",
      elevated: "border-border-default bg-elevated",
      accent: "border-accent bg-muted-surface",
      highlight: "border-accent bg-elevated",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

type DashboardPanelProps = Omit<SurfaceProps, "children" | "tone"> &
  VariantProps<typeof dashboardPanelVariants> & {
    children: ReactNode;
    title?: ReactNode;
    titleClassName?: string;
    titleTone?: "accent" | "default" | "muted" | "strong";
  };

export default function DashboardPanel({
  children,
  className,
  padding = "md",
  title,
  titleClassName,
  titleTone = "muted",
  tone,
  ...props
}: DashboardPanelProps) {
  return (
    <Surface
      padding={padding}
      tone="default"
      className={cn(dashboardPanelVariants({ tone }), className)}
      {...props}
    >
      {typeof title === "string" ? (
        <Label className={titleClassName} tone={titleTone}>
          {title}
        </Label>
      ) : title ? (
        title
      ) : null}
      {children}
    </Surface>
  );
}
