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
  const slideTiming = "cubic-bezier(0.2, 0.9, 0.25, 1)";

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

  return (
    <button
      type="button"
      aria-label={
        activeTheme === "dark" ? messages.site.themeSwitchToLight : messages.site.themeSwitchToDark
      }
      title={
        activeTheme === "dark" ? messages.site.themeSwitchToLight : messages.site.themeSwitchToDark
      }
      className={cn(
        "relative h-8 w-[3.6rem] overflow-hidden rounded-[0.32rem] border border-border-subtle bg-[color-mix(in_srgb,var(--token-color-bg-surface)_46%,transparent)] p-[0.15rem] transition-[border-color,background-color,box-shadow,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app hover:border-border-default/80 hover:bg-surface/72 active:scale-[0.985]",
        theme === null && "opacity-0"
      )}
      style={{
        boxShadow:
          "inset 0 1px 0 color-mix(in srgb, var(--token-color-text-primary) 4%, transparent), 0 4px 12px color-mix(in srgb, var(--token-color-bg-app) 5%, transparent)",
      }}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[0.15rem] rounded-[0.22rem] transition-[background,opacity] duration-500"
        style={{
          background:
            activeTheme === "dark"
              ? "linear-gradient(135deg, color-mix(in srgb, var(--token-color-info) 9%, transparent), color-mix(in srgb, var(--token-color-bg-app) 52%, transparent))"
              : "linear-gradient(135deg, color-mix(in srgb, var(--token-color-accent-primary) 9%, transparent), color-mix(in srgb, var(--token-color-bg-surface) 42%, transparent))",
          transitionTimingFunction: slideTiming,
        }}
      />

      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[0.32rem] h-[1.35rem] w-[1.35rem] rounded-[0.2rem] blur-[10px] transition-[transform,background-color,opacity] duration-500 opacity-70",
          activeTheme === "dark" ? "translate-x-[1.86rem]" : "translate-x-[0.32rem]"
        )}
        style={{
          background:
            activeTheme === "dark"
              ? "color-mix(in srgb, var(--token-color-info) 14%, transparent)"
              : "color-mix(in srgb, var(--token-color-accent-primary) 14%, transparent)",
          transitionTimingFunction: slideTiming,
        }}
      />

      <span
        className={cn(
          "absolute left-[0.15rem] top-[0.15rem] flex size-[1.55rem] items-center justify-center rounded-[0.22rem] border border-border-default/85 bg-app text-fg shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-[transform,border-color,background-color,color,box-shadow] duration-500 will-change-transform",
          activeTheme === "dark" ? "translate-x-[1.72rem]" : "translate-x-0"
        )}
        style={{
          boxShadow:
            activeTheme === "dark"
              ? "0 5px 12px rgba(0,0,0,0.16), inset 0 1px 0 color-mix(in srgb, var(--token-color-info) 10%, transparent)"
              : "0 5px 12px rgba(0,0,0,0.12), inset 0 1px 0 color-mix(in srgb, var(--token-color-accent-primary) 10%, transparent)",
          transitionTimingFunction: slideTiming,
        }}
      >
        <span className="relative flex size-[0.82rem] items-center justify-center overflow-hidden">
          <SunMedium
            className={cn(
              "absolute size-[0.82rem] text-accent transition-[opacity,transform] duration-400",
              activeTheme === "light"
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-25 scale-75 opacity-0"
            )}
            style={{ transitionTimingFunction: slideTiming }}
            aria-hidden="true"
          />
          <MoonStar
            className={cn(
              "absolute size-[0.82rem] text-info transition-[opacity,transform] duration-400",
              activeTheme === "dark"
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-25 scale-75 opacity-0"
            )}
            style={{ transitionTimingFunction: slideTiming }}
            aria-hidden="true"
          />
        </span>
      </span>
    </button>
  );
}
