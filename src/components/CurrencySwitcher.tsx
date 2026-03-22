"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, ChevronDown, CircleDollarSign, Search } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";
import { useI18n } from "../i18n/context";
import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  FIAT_CURRENCIES,
  POPULAR_CURRENCIES,
  RECENT_CURRENCIES_STORAGE_KEY,
  SUPPORTED_CURRENCIES,
  formatCurrencyLabel,
  getCurrencyDisplayName,
  isCurrency,
  isFiatCurrency,
  normalizeCurrencyList,
  type Currency,
} from "../lib/currency";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/Button";

function toSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getDedupedCurrencies(items: Currency[]) {
  const seen = new Set<string>();
  const deduped: Currency[] = [];

  for (const entry of items) {
    if (seen.has(entry)) {
      continue;
    }

    seen.add(entry);
    deduped.push(entry);
  }

  return deduped;
}

export default function CurrencySwitcher() {
  const { locale, messages } = useI18n();
  const [currency, setCurrency] = usePersistentState<Currency>(
    CURRENCY_STORAGE_KEY,
    DEFAULT_CURRENCY,
    { validator: isCurrency }
  );
  const [recentCurrencies, setRecentCurrencies] = usePersistentState<Currency[]>(
    RECENT_CURRENCIES_STORAGE_KEY,
    [],
    { normalize: (value) => normalizeCurrencyList(value, 6) }
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFiatOnly, setShowFiatOnly] = useState(true);
  const [highlightedCurrency, setHighlightedCurrency] = useState<Currency | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const menuId = useId();

  const visibleCurrencies = useMemo(
    () => (showFiatOnly ? FIAT_CURRENCIES : SUPPORTED_CURRENCIES),
    [showFiatOnly]
  );
  const visibleCurrencySet = useMemo(() => new Set<string>(visibleCurrencies), [visibleCurrencies]);

  const currencyLabels = useMemo(
    () =>
      Object.fromEntries(
        visibleCurrencies.map((entry) => [entry, getCurrencyDisplayName(entry, locale)])
      ),
    [locale, visibleCurrencies]
  );

  const popularCurrencies = useMemo(
    () => POPULAR_CURRENCIES.filter((entry) => visibleCurrencySet.has(entry)),
    [visibleCurrencySet]
  );

  const recentVisibleCurrencies = useMemo(
    () => recentCurrencies.filter((entry) => visibleCurrencySet.has(entry)),
    [recentCurrencies, visibleCurrencySet]
  );

  const searchableCurrencies = useMemo(
    () =>
      visibleCurrencies.filter(
        (entry) => !popularCurrencies.includes(entry) && !recentVisibleCurrencies.includes(entry)
      ),
    [popularCurrencies, recentVisibleCurrencies, visibleCurrencies]
  );

  const filteredCurrencies = useMemo(() => {
    const normalizedSearchTerm = toSearchValue(searchTerm);

    if (!normalizedSearchTerm) {
      return searchableCurrencies;
    }

    return searchableCurrencies.filter((entry) => {
      const codeMatch = entry.includes(normalizedSearchTerm);
      const labelMatch = currencyLabels[entry]?.toLowerCase().includes(normalizedSearchTerm);

      return codeMatch || labelMatch;
    });
  }, [currencyLabels, searchTerm, searchableCurrencies]);

  const orderedSelectableCurrencies = useMemo(
    () =>
      getDedupedCurrencies([
        ...recentVisibleCurrencies,
        ...popularCurrencies,
        ...filteredCurrencies,
      ]),
    [filteredCurrencies, popularCurrencies, recentVisibleCurrencies]
  );
  const activeHighlightedCurrency = useMemo(() => {
    if (!highlightedCurrency) {
      return orderedSelectableCurrencies[0] ?? null;
    }

    return orderedSelectableCurrencies.includes(highlightedCurrency)
      ? highlightedCurrency
      : (orderedSelectableCurrencies[0] ?? null);
  }, [highlightedCurrency, orderedSelectableCurrencies]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeHighlightedCurrency) {
      return;
    }

    const target = document.querySelector<HTMLButtonElement>(
      `button[data-currency-option="${activeHighlightedCurrency}"]`
    );

    target?.scrollIntoView({ block: "nearest" });
  }, [activeHighlightedCurrency, isOpen]);

  function handleCurrencySelect(value: Currency) {
    setCurrency(value);
    setRecentCurrencies((current) => normalizeCurrencyList([value, ...current], 6));
    setIsOpen(false);
    setSearchTerm("");
  }

  function moveHighlight(step: 1 | -1) {
    if (orderedSelectableCurrencies.length === 0) {
      setHighlightedCurrency(null);
      return;
    }

    const currentIndex = activeHighlightedCurrency
      ? orderedSelectableCurrencies.indexOf(activeHighlightedCurrency)
      : -1;

    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + step + orderedSelectableCurrencies.length) %
          orderedSelectableCurrencies.length;

    setHighlightedCurrency(orderedSelectableCurrencies[nextIndex] ?? null);
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!isOpen) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedCurrency(orderedSelectableCurrencies[0] ?? null);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedCurrency(
        orderedSelectableCurrencies[orderedSelectableCurrencies.length - 1] ?? null
      );
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && activeHighlightedCurrency) {
      event.preventDefault();
      handleCurrencySelect(activeHighlightedCurrency);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          aria-label={messages.site.currencyCloseLabel}
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <button
        type="button"
        aria-label={messages.site.currencySwitchLabel}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          buttonVariants({
            active: isOpen,
            intent: "secondary",
            size: "md",
          }),
          "relative z-30 min-w-[8rem] justify-between gap-2 border-border-default/90 bg-elevated/40 pr-2.5 text-fg"
        )}
        onClick={() => {
          if (!isOpen && !isFiatCurrency(currency)) {
            setShowFiatOnly(false);
          }

          setIsOpen((current) => !current);
        }}
      >
        <span className="flex items-center gap-2">
          <CircleDollarSign className="size-4 text-fg-muted" aria-hidden="true" />
          <span className="text-[0.72rem] tracking-[0.22em]">{formatCurrencyLabel(currency)}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-fg-muted transition-transform duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={messages.site.currencySwitchLabel}
        className={cn(
          "fixed inset-x-3 bottom-3 top-[4.5rem] z-30 flex flex-col rounded-sm border border-border-default/80 bg-surface/98 p-1.5 shadow-elevated backdrop-blur-sm transition duration-[var(--motion-fast)] ease-[var(--ease-standard)] sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.55rem)] sm:h-auto sm:max-h-[32rem] sm:w-[20.5rem]",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0 sm:-translate-y-1"
        )}
        onKeyDown={handleMenuKeyDown}
      >
        <div className="p-1.5">
          <label
            htmlFor={`${menuId}-search`}
            className="mb-1.5 block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fg-muted"
          >
            {messages.site.currencySearchLabel}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              id={`${menuId}-search`}
              type="text"
              value={searchTerm}
              placeholder={messages.site.currencySearchPlaceholder}
              className="h-9 w-full rounded-sm border border-border-default/80 bg-elevated/65 pl-8 pr-3 text-sm text-fg outline-none transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] placeholder:text-fg-muted focus:border-accent/50"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fg-muted">
              {messages.site.currencyScopeLabel}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={cn(
                  buttonVariants({
                    intent: "secondary",
                    size: "sm",
                    active: showFiatOnly,
                  }),
                  "min-h-8 min-w-[5.75rem] px-2 text-[0.58rem]"
                )}
                onClick={() => {
                  setShowFiatOnly(true);
                  setSearchTerm("");
                }}
              >
                {messages.site.currencyScopeFiatOnly}
              </button>
              <button
                type="button"
                className={cn(
                  buttonVariants({
                    intent: "secondary",
                    size: "sm",
                    active: !showFiatOnly,
                  }),
                  "min-h-8 min-w-[7.5rem] px-2 text-[0.58rem]"
                )}
                onClick={() => {
                  setShowFiatOnly(false);
                  setSearchTerm("");
                }}
              >
                {messages.site.currencyScopeAllQuotes}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-border-subtle px-1.5 pt-2">
          {recentVisibleCurrencies.length > 0 ? (
            <div className="pb-2">
              <p className="px-2 pb-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fg-muted">
                {messages.site.currencyRecentLabel}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {recentVisibleCurrencies.map((entry) => {
                  const isActive = entry === currency;

                  return (
                    <button
                      key={`recent-${entry}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      data-currency-option={entry}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-sm border px-2 text-[0.63rem] font-medium uppercase tracking-[0.16em] transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                        isActive || activeHighlightedCurrency === entry
                          ? "border-accent/60 bg-accent-soft text-fg"
                          : "border-border-default/70 text-fg-secondary hover:border-accent/45 hover:bg-elevated hover:text-fg"
                      )}
                      onMouseEnter={() => setHighlightedCurrency(entry)}
                      onClick={() => handleCurrencySelect(entry)}
                    >
                      {formatCurrencyLabel(entry)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="border-t border-border-subtle pb-2 pt-2">
            <p className="px-2 pb-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fg-muted">
              {messages.site.currencyPopularLabel}
            </p>
            <div className="grid grid-cols-5 gap-1">
              {popularCurrencies.map((entry) => {
                const isActive = entry === currency;

                return (
                  <button
                    key={`popular-${entry}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    data-currency-option={entry}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-sm border px-2 text-[0.64rem] font-medium uppercase tracking-[0.16em] transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                      isActive || activeHighlightedCurrency === entry
                        ? "border-accent/60 bg-accent-soft text-fg"
                        : "border-border-default/70 text-fg-secondary hover:border-accent/45 hover:bg-elevated hover:text-fg"
                    )}
                    onMouseEnter={() => setHighlightedCurrency(entry)}
                    onClick={() => handleCurrencySelect(entry)}
                  >
                    {formatCurrencyLabel(entry)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border-subtle pt-2">
            <p className="px-2 pb-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fg-muted">
              {messages.site.currencyAllLabel}
            </p>

            <div className="pb-1">
              {filteredCurrencies.length === 0 ? (
                <p className="px-2 py-2 text-sm text-fg-muted">{messages.site.currencyNoResults}</p>
              ) : (
                filteredCurrencies.map((entry) => {
                  const isActive = entry === currency;

                  return (
                    <button
                      key={`all-${entry}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      data-currency-option={entry}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                        isActive || activeHighlightedCurrency === entry
                          ? "bg-accent-soft text-fg"
                          : "text-fg-secondary hover:bg-elevated hover:text-fg"
                      )}
                      onMouseEnter={() => setHighlightedCurrency(entry)}
                      onClick={() => handleCurrencySelect(entry)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em]">
                          {formatCurrencyLabel(entry)}
                        </span>
                        <span className="text-sm tracking-[-0.01em]">{currencyLabels[entry]}</span>
                      </span>
                      <Check
                        className={cn("size-4", isActive ? "opacity-100 text-accent" : "opacity-0")}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
