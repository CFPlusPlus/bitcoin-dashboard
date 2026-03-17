import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import StatePanel from "./StatePanel";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  title: ReactNode;
};

export default function ErrorState(props: ErrorStateProps) {
  return <StatePanel icon={AlertTriangle} tone="error" {...props} />;
}
