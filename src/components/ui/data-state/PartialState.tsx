import { Layers2 } from "lucide-react";
import type { ReactNode } from "react";
import StatePanel from "./StatePanel";

type PartialStateProps = {
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  description: ReactNode;
  title: ReactNode;
};

export default function PartialState(props: PartialStateProps) {
  return <StatePanel icon={Layers2} tone="partial" {...props} />;
}
