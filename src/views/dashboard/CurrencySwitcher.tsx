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
    <div className="range-switcher" role="tablist" aria-label="Währung">
      {(["usd", "eur"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={currency === value ? "range-btn active" : "range-btn"}
          onClick={() => onChange(value)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
