import { Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import StatePanel from "./StatePanel";

type StaleStateProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  title: ReactNode;
};

export default function StaleState(props: StaleStateProps) {
  return <StatePanel icon={Clock3} tone="stale" {...props} />;
}
