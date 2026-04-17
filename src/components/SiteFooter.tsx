import Link from "next/link";
import packageJson from "../../package.json";
import { buttonVariants } from "./ui/Button";
import Label from "./ui/content/Label";
import PageContainer from "./ui/layout/PageContainer";
import type { Dictionary } from "../i18n/dictionaries";
import type { AppLocale } from "../i18n/config";
import { getLocalizedPathname } from "../i18n/config";

type SiteFooterProps = {
  locale: AppLocale;
  messages: Dictionary["site"];
};

export default function SiteFooter({ locale, messages }: SiteFooterProps) {
  const navItems = [
    { href: "/", label: messages.footer.dashboard },
    { href: "/tools", label: messages.footer.tools },
  ];
  const legalItems = [
    { href: "/impressum", label: messages.footer.imprint },
    { href: "/datenschutz", label: messages.footer.privacy },
  ];
  const [taglineLead, ...taglineRest] = messages.tagline.split(" ");

  return (
    <footer className="mt-10 border-t border-border-default/80 bg-muted-surface">
      <PageContainer
        as="div"
        width="wide"
        className="grid w-full gap-6 py-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.9fr)] sm:py-8"
      >
        <div className="space-y-3">
          <Label tone="accent">{messages.name}</Label>
          <p className="type-section max-w-2xl text-fg">
            <span className="text-accent">{taglineLead}</span>
            {taglineRest.length > 0 ? ` ${taglineRest.join(" ")}` : null}
          </p>
          <p className="type-body max-w-xl text-fg-secondary">{messages.footer.description}</p>
        </div>

        <div className="flex flex-col gap-6 sm:items-end">
          <div className="space-y-3 sm:text-right">
            <Label tone="muted">{messages.footer.navigation}</Label>
            <nav
              className="flex flex-wrap gap-3 sm:justify-end"
              aria-label={messages.footer.navigation}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={getLocalizedPathname(locale, item.href)}
                  className={buttonVariants({
                    intent: "secondary",
                    size: "sm",
                  })}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3 sm:text-right">
            <Label tone="muted">{messages.footer.legal}</Label>
            <nav className="flex flex-wrap gap-3 sm:justify-end" aria-label={messages.footer.legal}>
              {legalItems.map((item) => (
                <Link
                  key={item.href}
                  href={getLocalizedPathname(locale, item.href)}
                  className={buttonVariants({
                    intent: "secondary",
                    size: "sm",
                  })}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="text-left sm:text-right">
            <Label size="sm" treatment="marker" tone="muted">
              {messages.footer.version} v{packageJson.version}
            </Label>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
