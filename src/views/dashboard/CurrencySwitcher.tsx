import Button from "../../components/ui/Button";
import type { Currency } from "../../types/dashboard";

type CurrencySwitcherProps = {
  currency: Currency;
  onChange: (value: Currency) => void;
};

export default function CurrencySwitcher({
  currency,
  onChange,
}: CurrencySwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Währung">
      {(["usd", "eur"] as const).map((value) => (
        <Button
          key={value}
          active={currency === value}
          intent="secondary"
          size="sm"
          onClick={() => onChange(value)}
        >
          {value.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
