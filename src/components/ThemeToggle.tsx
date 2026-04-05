"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function ThemeToggle() {
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
        "inline-flex h-8 min-w-[8.5rem] items-center justify-center gap-2 rounded-md border border-border-default bg-surface px-3 text-[0.64rem] font-medium uppercase tracking-[0.16em] text-fg-secondary transition-[border-color,background-color,color,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app hover:border-accent hover:bg-elevated hover:text-fg",
        theme === null && "opacity-0"
      )}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {activeTheme === "dark" ? (
        <SunMedium className="size-4 text-accent" aria-hidden="true" />
      ) : (
        <MoonStar className="size-4 text-accent" aria-hidden="true" />
      )}
      <span>{buttonLabel}</span>
    </button>
  );
}
