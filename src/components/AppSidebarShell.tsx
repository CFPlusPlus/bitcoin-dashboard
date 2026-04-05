"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Network,
  Scale,
  Shield,
  Wrench,
  X,
} from "lucide-react";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { getLocalizedPathname, type AppLocale } from "../i18n/config";
import { useI18n } from "../i18n/context";
import { cn } from "../lib/cn";
import { getDashboardSectionId, type DashboardSectionId } from "../lib/dashboard-workspace";

type AppSidebarShellProps = {
  children: ReactNode;
};

type SidebarLink = {
  href: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  label: string;
};

function SidebarGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: SidebarLink[];
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-fg-muted">
        {label}
      </p>

      <nav className="space-y-1.5" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-md border px-3.5 py-2.5 text-sm font-medium tracking-[-0.01em] transition-[border-color,background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                item.isActive
                  ? "border-border-default bg-elevated text-fg"
                  : "border-transparent text-fg-secondary hover:border-border-subtle hover:bg-surface hover:text-fg"
              )}
              onClick={onNavigate}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  item.isActive
                    ? "border-accent bg-elevated text-accent"
                    : "border-border-default bg-app text-fg-muted group-hover:border-border-default group-hover:bg-elevated group-hover:text-fg"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">{item.label}</span>
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  item.isActive
                    ? "translate-x-0 text-accent"
                    : "text-fg-muted group-hover:translate-x-0.5"
                )}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function buildSectionHref(locale: AppLocale, sectionId: DashboardSectionId) {
  const homeHref = getLocalizedPathname(locale, "/");

  if (sectionId === "overview") {
    return homeHref;
  }

  return `${homeHref}?section=${sectionId}`;
}

export default function AppSidebarShell({ children }: AppSidebarShellProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeHref = getLocalizedPathname(locale, "/");
  const toolsHref = getLocalizedPathname(locale, "/tools");
  const dcaHref = getLocalizedPathname(locale, "/tools/dca-rechner");
  const imprintHref = getLocalizedPathname(locale, "/impressum");
  const privacyHref = getLocalizedPathname(locale, "/datenschutz");
  const activeSection = getDashboardSectionId(searchParams?.get("section"));
  const onDashboardRoute = pathname === homeHref;

  const dashboardItems: SidebarLink[] = [
    {
      href: buildSectionHref(locale, "overview"),
      icon: LayoutDashboard,
      isActive: onDashboardRoute && activeSection === "overview",
      label: messages.nav.sections.overview,
    },
    {
      href: buildSectionHref(locale, "performance"),
      icon: BarChart3,
      isActive: onDashboardRoute && activeSection === "performance",
      label: messages.nav.sections.performance,
    },
    {
      href: buildSectionHref(locale, "market"),
      icon: Activity,
      isActive: onDashboardRoute && activeSection === "market",
      label: messages.nav.sections.market,
    },
    {
      href: buildSectionHref(locale, "cycle"),
      icon: Scale,
      isActive: onDashboardRoute && activeSection === "cycle",
      label: messages.nav.sections.cycle,
    },
    {
      href: buildSectionHref(locale, "network"),
      icon: Network,
      isActive: onDashboardRoute && activeSection === "network",
      label: messages.nav.sections.network,
    },
    {
      href: buildSectionHref(locale, "onchain"),
      icon: Activity,
      isActive: onDashboardRoute && activeSection === "onchain",
      label: messages.nav.sections.onchain,
    },
    {
      href: buildSectionHref(locale, "sources"),
      icon: Shield,
      isActive: onDashboardRoute && activeSection === "sources",
      label: messages.nav.sections.sources,
    },
  ];

  const toolItems: SidebarLink[] = [
    {
      href: toolsHref,
      icon: Wrench,
      isActive: pathname === toolsHref,
      label: messages.nav.toolsOverview,
    },
    {
      href: dcaHref,
      icon: BarChart3,
      isActive: pathname === dcaHref,
      label: messages.nav.dcaCalculator,
    },
  ];

  const supportItems: SidebarLink[] = [
    {
      href: imprintHref,
      icon: Shield,
      isActive: pathname === imprintHref,
      label: messages.nav.imprint,
    },
    {
      href: privacyHref,
      icon: Shield,
      isActive: pathname === privacyHref,
      label: messages.nav.privacy,
    },
  ];

  const currentViewLabel =
    dashboardItems.find((item) => item.isActive)?.label ??
    toolItems.find((item) => item.isActive)?.label ??
    supportItems.find((item) => item.isActive)?.label ??
    messages.nav.dashboard;

  return (
    <div className="min-h-screen">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          aria-label={messages.nav.closeSidebar}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[17.75rem] shrink-0 flex-col border-r border-border-default bg-surface transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col gap-6 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link
              href={homeHref}
              className="min-w-0 flex-1 text-left"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/favicon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-fg">
                    bitstats.org
                  </p>
                  <p className="truncate text-xs uppercase tracking-[0.18em] text-fg-muted">
                    {messages.nav.workspace}
                  </p>
                </div>
              </div>
            </Link>

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border-default bg-app text-fg-secondary transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:bg-elevated hover:text-fg lg:hidden"
              aria-label={messages.nav.closeSidebar}
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            <SidebarGroup
              label={messages.nav.groups.dashboard}
              items={dashboardItems}
              onNavigate={() => setMobileOpen(false)}
            />

            <SidebarGroup
              label={messages.nav.groups.tools}
              items={toolItems}
              onNavigate={() => setMobileOpen(false)}
            />

            <SidebarGroup
              label={messages.nav.groups.support}
              items={supportItems}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>

          <div className="space-y-3 rounded-sm border border-border-default bg-app p-3.5 lg:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-fg-muted">
              {messages.nav.utilities}
            </p>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-fg-secondary">{messages.nav.theme}</span>
              <ThemeToggle />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <CurrencySwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[17.75rem]">
        <div className="sticky top-0 z-20 border-b border-border-default bg-app lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-accent">
                {messages.nav.workspace}
              </p>
              <p className="truncate text-base font-semibold tracking-[-0.03em] text-fg">
                {currentViewLabel}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-border-default bg-surface text-fg-secondary transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:text-fg"
              aria-label={messages.nav.openSidebar}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="hidden border-b border-border-default bg-app lg:block">
          <div className="flex items-center justify-end gap-2 px-8 py-4">
            <ThemeToggle />
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
