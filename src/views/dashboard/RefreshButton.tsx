import { RefreshCw } from "lucide-react";
import Button from "../../components/ui/Button";

type RefreshButtonProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export default function RefreshButton({
  refreshing,
  onRefresh,
}: RefreshButtonProps) {
  return (
    <Button intent="primary" onClick={onRefresh} disabled={refreshing}>
      <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {refreshing ? "Ansicht wird erneuert..." : "Jetzt erneuern"}
    </Button>
  );
}
