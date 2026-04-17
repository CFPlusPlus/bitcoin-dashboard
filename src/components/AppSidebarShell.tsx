"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CircleDollarSign,
  Database,
  FileText,
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
import Label from "./ui/content/Label";
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
      <Label className="px-2" tone="muted">
        {label}
      </Label>

      <nav className="space-y-1" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "group relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-fg-secondary transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                item.isActive ? "bg-transparent text-fg" : "hover:bg-elevated/65 hover:text-fg"
              )}
              onClick={onNavigate}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-2 left-0 w-px rounded-full bg-transparent transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  item.isActive ? "bg-accent" : "group-hover:bg-border-default"
                )}
              />
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  item.isActive
                    ? "bg-accent/10 text-accent"
                    : "bg-app/70 text-fg-muted group-hover:bg-muted-surface group-hover:text-fg-secondary"
                )}
              >
                <Icon className="size-[0.95rem]" aria-hidden="true" />
              </span>
              <span className="type-body min-w-0 flex-1 text-inherit">{item.label}</span>
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
      icon: CircleDollarSign,
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
      icon: Database,
      isActive: onDashboardRoute && activeSection === "onchain",
      label: messages.nav.sections.onchain,
    },
    {
      href: buildSectionHref(locale, "sources"),
      icon: BookOpen,
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
      icon: Calculator,
      isActive: pathname === dcaHref,
      label: messages.nav.dcaCalculator,
    },
  ];

  const supportItems: SidebarLink[] = [
    {
      href: imprintHref,
      icon: FileText,
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
                  <p className="type-body truncate font-medium text-fg">bitstats.org</p>
                  <Label className="truncate" size="sm" tone="muted">
                    {messages.nav.workspace}
                  </Label>
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

          <div className="space-y-3 rounded-sm border border-border-default/80 bg-app p-3.5 lg:hidden">
            <Label tone="muted">{messages.nav.utilities}</Label>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-fg-secondary">{messages.nav.theme}</span>
              <ThemeToggle className="w-full min-w-0 justify-between" />
            </div>

            <div className="grid gap-2">
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
              <Label tone="accent">{messages.nav.workspace}</Label>
              <p className="type-body truncate font-medium text-fg">{currentViewLabel}</p>
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
