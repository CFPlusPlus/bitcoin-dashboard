import { RotateCw } from "lucide-react";
import Button from "../Button";

type RetryButtonProps = {
  busy?: boolean;
  label?: string;
  onClick: () => void;
};

export default function RetryButton({
  busy = false,
  label = "Erneut laden",
  onClick,
}: RetryButtonProps) {
  return (
    <Button intent="secondary" size="sm" onClick={onClick} disabled={busy}>
      <RotateCw className={busy ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {busy ? "Lade neu..." : label}
    </Button>
  );
}
