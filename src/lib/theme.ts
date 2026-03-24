export const THEME_STORAGE_KEY = "bitstats-theme";
export const THEME_EVENT_NAME = "bitstats-theme-change";

export const THEMES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEMES)[number];

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function resolveThemeMode(value: unknown, prefersDark: boolean): ThemeMode {
  if (isThemeMode(value)) {
    return value;
  }

  return prefersDark ? "dark" : "light";
}

export function readStoredThemePreference(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isThemeMode(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function getSystemThemePreference(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readThemeFromDocument(): ThemeMode {
  if (typeof document === "undefined") {
    return "dark";
  }

  const documentTheme = document.documentElement.dataset.theme;

  if (isThemeMode(documentTheme)) {
    return documentTheme;
  }

  return resolveThemeMode(readStoredThemePreference(), getSystemThemePreference() === "dark");
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {}

    window.dispatchEvent(new Event(THEME_EVENT_NAME));
  }
}

export function applySystemThemePreference() {
  if (typeof document === "undefined") {
    return;
  }

  const theme = getSystemThemePreference();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function getThemeInitScript() {
  return `(() => {
    const root = document.documentElement;
    const apply = (theme) => {
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    };
    try {
      const rawValue = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
      const parsedValue = rawValue ? JSON.parse(rawValue) : null;
      const theme = parsedValue === "light" || parsedValue === "dark"
        ? parsedValue
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      apply(theme);
    } catch {
      apply(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  })();`;
}
