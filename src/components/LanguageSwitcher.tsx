"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { DEFAULT_LOCALE, LOCALES, getLocalizedPathname, localeLabels } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { cn } from "../lib/cn";
import { buttonVariants } from "./ui/Button";

export default function LanguageSwitcher() {
  const pathname = usePathname() ?? `/${DEFAULT_LOCALE}`;
  const { locale, messages } = useI18n();

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={messages.site.languageSwitchLabel}
    >
      <Languages className="size-4 text-fg-muted" aria-hidden="true" />
      {LOCALES.map((entry) => {
        const isActive = entry === locale;

        return (
          <Link
            key={entry}
            href={getLocalizedPathname(entry, pathname)}
            hrefLang={entry}
            className={cn(
              buttonVariants({
                active: isActive,
                intent: "secondary",
                size: "sm",
              }),
              "min-w-[5.25rem] justify-center"
            )}
          >
            {localeLabels[entry]}
          </Link>
        );
      })}
    </div>
  );
}
