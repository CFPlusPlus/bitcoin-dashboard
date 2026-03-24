"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedPathname } from "../i18n/config";
import { useI18n } from "../i18n/context";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function SiteNavigation() {
  const pathname = usePathname() ?? "/";
  const { locale, messages } = useI18n();
  const navItems = [
    { label: messages.nav.dashboard, href: "/" },
    { label: messages.nav.tools, href: "/tools" },
  ];

  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:gap-4 lg:w-auto lg:gap-5">
      <nav
        className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5"
        aria-label={messages.nav.ariaLabel}
      >
        {navItems.map((item) => {
          const localizedHref = getLocalizedPathname(locale, item.href);
          const isActive =
            localizedHref === `/${locale}`
              ? pathname === localizedHref
              : pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);

          return (
            <Link
              key={item.href}
              href={localizedHref}
              className={
                isActive
                  ? "inline-flex h-8 items-center border-b border-accent pb-px text-[0.69rem] font-medium uppercase tracking-[0.22em] text-fg transition-[border-color,color,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)]"
                  : "inline-flex h-8 items-center border-b border-transparent pb-px text-[0.69rem] font-medium uppercase tracking-[0.22em] text-fg-secondary transition-[border-color,color,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:text-fg hover:border-border-default/70"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <CurrencySwitcher />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
