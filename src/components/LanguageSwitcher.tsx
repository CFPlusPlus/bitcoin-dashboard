"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
import { DEFAULT_LOCALE, LOCALES, getLocalizedPathname, localeLabels } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/Button";

export default function LanguageSwitcher() {
  const pathname = usePathname() ?? `/${DEFAULT_LOCALE}`;
  const { locale, messages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={messages.site.languageSwitchLabel}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          buttonVariants({
            active: isOpen,
            intent: "secondary",
            size: "md",
          }),
          "min-w-[7rem] justify-between gap-2 border-border-default/90 bg-elevated/40 pr-2.5 text-fg"
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <Languages className="size-4 text-fg-muted" aria-hidden="true" />
          <span className="text-[0.72rem] tracking-[0.22em]">{locale.toUpperCase()}</span>
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
        aria-label={messages.site.languageSwitchLabel}
        className={cn(
          "absolute right-0 top-[calc(100%+0.55rem)] z-30 min-w-[12rem] origin-top-right rounded-sm border border-border-default/80 bg-surface/96 p-1.5 shadow-elevated backdrop-blur-sm transition duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        {LOCALES.map((entry) => {
          const isActive = entry === locale;

          return (
            <Link
              key={entry}
              role="menuitem"
              href={getLocalizedPathname(entry, pathname)}
              hrefLang={entry}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                isActive
                  ? "bg-accent-soft text-fg"
                  : "text-fg-secondary hover:bg-elevated hover:text-fg"
              )}
              onClick={() => setIsOpen(false)}
            >
              <span className="flex flex-col">
                <span className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-fg-muted">
                  {entry.toUpperCase()}
                </span>
                <span className="text-sm font-medium tracking-[-0.01em]">
                  {localeLabels[entry]}
                </span>
              </span>
              <Check
                className={cn(
                  "size-4 transition-opacity duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  isActive ? "opacity-100 text-accent" : "opacity-0"
                )}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
