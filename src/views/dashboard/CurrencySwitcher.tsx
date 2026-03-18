"use client";

import Button from "../../components/ui/Button";
import { useI18n } from "../../i18n/context";
import type { Currency } from "../../types/dashboard";

type CurrencySwitcherProps = {
  currency: Currency;
  onChange: (value: Currency) => void;
};

export default function CurrencySwitcher({ currency, onChange }: CurrencySwitcherProps) {
  const { messages } = useI18n();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label={messages.dashboard.controls.currencyAriaLabel}
    >
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
