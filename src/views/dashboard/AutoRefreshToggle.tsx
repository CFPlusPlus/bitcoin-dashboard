import Button from "../../components/ui/Button";

type AutoRefreshToggleProps = {
  autoRefresh: boolean;
  onChange: (value: boolean) => void;
};

export default function AutoRefreshToggle({
  autoRefresh,
  onChange,
}: AutoRefreshToggleProps) {
  return (
    <Button
      active={autoRefresh}
      intent="secondary"
      size="sm"
      onClick={() => onChange(!autoRefresh)}
    >
      {autoRefresh ? "Live aktiv" : "Live pausiert"}
    </Button>
  );
}
