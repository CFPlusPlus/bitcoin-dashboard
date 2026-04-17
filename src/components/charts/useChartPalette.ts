"use client";

import { useEffect, useMemo, useState } from "react";

export type ChartTone = "accent" | "default" | "success" | "danger";

export type ChartPalette = {
  areaEnd: string;
  areaStart: string;
  fontNumeric: string;
  fontSans: string;
  grid: string;
  guide: string;
  line: string;
  lineStrong: string;
  pointFill: string;
  textMuted: string;
  tooltipBackground: string;
  tooltipBorder: string;
};

const FALLBACK_VARS = {
  accentPrimary: "#f7931a",
  accentStrong: "#ffb14d",
  bgApp: "#080b0f",
  borderDefault: "rgba(237, 242, 247, 0.11)",
  borderSubtle: "rgba(237, 242, 247, 0.06)",
  danger: "#d06b63",
  fontNumeric:
    '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Cascadia Code", Consolas, "Liberation Mono", monospace',
  fontSans: '"Open Sauce Sans", ui-sans-serif, system-ui, sans-serif',
  success: "#58b98b",
  textMuted: "#737e8a",
  textPrimary: "#edf2f7",
  textSecondary: "#afbac5",
};

function parseHexColor(value: string) {
  const normalized = value.trim().replace("#", "");

  if (normalized.length === 3) {
    return [
      Number.parseInt(normalized[0] + normalized[0], 16),
      Number.parseInt(normalized[1] + normalized[1], 16),
      Number.parseInt(normalized[2] + normalized[2], 16),
    ] as const;
  }

  if (normalized.length === 6) {
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ] as const;
  }

  return null;
}

function parseRgbColor(value: string) {
  const match = value
    .trim()
    .match(/rgba?\(\s*([0-9.]+)(?:\s+|,\s*)([0-9.]+)(?:\s+|,\s*)([0-9.]+)/i);

  if (!match) return null;

  return [
    Number.parseFloat(match[1]),
    Number.parseFloat(match[2]),
    Number.parseFloat(match[3]),
  ] as const;
}

function toRgba(value: string, alpha: number) {
  const rgb = value.trim().startsWith("#") ? parseHexColor(value) : parseRgbColor(value);

  if (!rgb) {
    return value;
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(alpha, 1))})`;
}

function readThemeVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function buildPalette(tone: ChartTone): ChartPalette {
  const vars = {
    accentPrimary: readThemeVar("--token-color-accent-primary", FALLBACK_VARS.accentPrimary),
    accentStrong: readThemeVar("--token-color-accent-strong", FALLBACK_VARS.accentStrong),
    bgApp: readThemeVar("--token-color-bg-app", FALLBACK_VARS.bgApp),
    borderDefault: readThemeVar("--token-color-border-default", FALLBACK_VARS.borderDefault),
    borderSubtle: readThemeVar("--token-color-border-subtle", FALLBACK_VARS.borderSubtle),
    danger: readThemeVar("--token-color-danger", FALLBACK_VARS.danger),
    fontNumeric: readThemeVar("--token-font-family-numeric", FALLBACK_VARS.fontNumeric),
    fontSans: readThemeVar("--token-font-family-sans", FALLBACK_VARS.fontSans),
    success: readThemeVar("--token-color-success", FALLBACK_VARS.success),
    textMuted: readThemeVar("--token-color-text-muted", FALLBACK_VARS.textMuted),
    textPrimary: readThemeVar("--token-color-text-primary", FALLBACK_VARS.textPrimary),
    textSecondary: readThemeVar("--token-color-text-secondary", FALLBACK_VARS.textSecondary),
  };

  const line =
    tone === "accent"
      ? vars.accentPrimary
      : tone === "success"
        ? vars.success
        : tone === "danger"
          ? vars.danger
          : vars.textSecondary;
  const lineStrong =
    tone === "accent" ? vars.accentStrong : tone === "default" ? vars.textPrimary : line;

  return {
    areaEnd: toRgba(line, 0.02),
    areaStart: toRgba(lineStrong, tone === "accent" ? 0.2 : 0.14),
    fontNumeric: vars.fontNumeric,
    fontSans: vars.fontSans,
    grid: vars.borderSubtle,
    guide: toRgba(vars.textPrimary, 0.18),
    line,
    lineStrong,
    pointFill: vars.bgApp,
    textMuted: vars.textMuted,
    tooltipBackground: vars.bgApp,
    tooltipBorder: vars.borderDefault,
  };
}

export function useChartPalette(tone: ChartTone): ChartPalette {
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleThemeChange = () => {
      setThemeVersion((current) => current + 1);
    };

    const rootObserver = new MutationObserver(handleThemeChange);
    rootObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-theme", "style"],
      attributes: true,
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      rootObserver.disconnect();
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return useMemo(() => {
    void themeVersion;
    return buildPalette(tone);
  }, [themeVersion, tone]);
}
