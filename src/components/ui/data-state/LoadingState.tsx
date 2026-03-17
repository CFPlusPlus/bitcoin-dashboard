import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import StatePanel from "./StatePanel";

type LoadingStateProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  title: ReactNode;
};

export default function LoadingState(props: LoadingStateProps) {
  return <StatePanel icon={LoaderCircle} tone="loading" {...props} />;
}
