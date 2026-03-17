import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import StatePanel from "./StatePanel";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  title: ReactNode;
};

export default function EmptyState(props: EmptyStateProps) {
  return <StatePanel icon={Inbox} tone="empty" {...props} />;
}
