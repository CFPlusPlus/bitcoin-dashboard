"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { useI18n } from "../i18n/context";
import {
  THEME_EVENT_NAME,
  applySystemThemePreference,
  applyTheme,
  readStoredThemePreference,
  readThemeFromDocument,
  type ThemeMode,
} from "../lib/theme";
import { cn } from "../lib/cn";

type ThemeToggleProps = Pick<HTMLAttributes<HTMLButtonElement>, "className">;

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { messages } = useI18n();
  const [theme, setTheme] = useState<ThemeMode | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      setTheme(readThemeFromDocument());
    };

    const handleStorageChange = () => {
      syncTheme();
    };

    const handleSystemChange = () => {
      if (readStoredThemePreference() === null) {
        applySystemThemePreference();
        syncTheme();
      }
    };

    syncTheme();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(THEME_EVENT_NAME, handleStorageChange);
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(THEME_EVENT_NAME, handleStorageChange);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  const activeTheme = theme ?? "dark";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";
  const label =
    activeTheme === "dark" ? messages.site.themeSwitchToLight : messages.site.themeSwitchToDark;
  const buttonLabel =
    activeTheme === "dark" ? messages.site.themeButtonLight : messages.site.themeButtonDark;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "group inline-flex h-8 min-w-[5.75rem] items-center justify-center gap-1.5 rounded-md border border-border-default/80 bg-surface px-2.5 text-[0.74rem] font-medium tracking-[0.01em] text-fg-muted transition-[border-color,background-color,color,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app hover:border-border-default hover:bg-elevated/70 hover:text-fg-secondary",
        theme === null && "opacity-0",
        className
      )}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {activeTheme === "dark" ? (
        <SunMedium
          className="size-3.5 text-fg-muted transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] group-hover:text-fg-secondary"
          aria-hidden="true"
        />
      ) : (
        <MoonStar
          className="size-3.5 text-fg-muted transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] group-hover:text-fg-secondary"
          aria-hidden="true"
        />
      )}
      <span>{buttonLabel}</span>
    </button>
  );
}
