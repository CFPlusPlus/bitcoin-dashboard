"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedPathname } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { cn } from "../lib/cn";
import LanguageSwitcher from "./LanguageSwitcher";
import { buttonVariants } from "./ui/Button";

export default function SiteNavigation() {
  const pathname = usePathname() ?? "/";
  const { locale, messages } = useI18n();
  const navItems = [
    { label: messages.nav.dashboard, href: "/" },
    { label: messages.nav.tools, href: "/tools" },
  ];

  return (
    <div className="flex items-center gap-2">
      <nav className="flex items-center gap-2" aria-label={messages.nav.ariaLabel}>
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
              className={cn(
                buttonVariants({
                  active: isActive,
                  intent: "secondary",
                  size: "md",
                }),
                "min-w-[6.5rem] justify-center"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <LanguageSwitcher />
    </div>
  );
}
