import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppProviders from "../../components/AppProviders";
import LocaleDocumentSync from "../../components/LocaleDocumentSync";
import SiteFooter from "../../components/SiteFooter";
import SiteNavigation from "../../components/SiteNavigation";
import StructuredData from "../../components/StructuredData";
import PageContainer from "../../components/ui/layout/PageContainer";
import { LOCALES, isValidLocale } from "../../i18n/config";
import { I18nProvider } from "../../i18n/context";
import { getDictionary } from "../../i18n/dictionaries";
import { createLayoutMetadata, createWebsiteSchema, serializeJsonLd } from "../../lib/seo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const messages = getDictionary(locale);

  return createLayoutMetadata({
    locale,
    title: messages.site.name,
    description: messages.metadata.defaultDescription,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = getDictionary(locale);

  return (
    <AppProviders>
      <I18nProvider locale={locale} messages={messages}>
        <LocaleDocumentSync locale={locale} />
        <StructuredData
          data={serializeJsonLd(
            createWebsiteSchema({ locale, description: messages.metadata.defaultDescription })
          )}
        />
        <main className="flex min-h-screen flex-col py-0">
          <header
            className="w-full border-b border-border-default/80"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--token-color-text-primary) 1.8%, transparent), transparent 100%), linear-gradient(180deg, color-mix(in srgb, var(--token-color-bg-surface) 94%, transparent), color-mix(in srgb, var(--token-color-bg-app) 92%, transparent))",
            }}
          >
            <PageContainer
              as="div"
              width="wide"
              className="flex flex-col gap-2 py-2 sm:gap-3 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
            >
              <Link href={`/${locale}`} className="min-w-0 max-w-fit text-left">
                <div className="flex flex-col gap-1">
                  <p className="font-serif text-[1.34rem] leading-none tracking-[0.002em] text-fg sm:text-[1.78rem]">
                    <span className="text-fg">bit</span>
                    <span className="text-accent">stats</span>
                    <span className="ml-0.75 inline-block text-[0.56em] text-fg-secondary">
                      .org
                    </span>
                  </p>
                  <p className="hidden font-sans text-[0.8rem] leading-[1.1] tracking-[-0.005em] text-fg-muted sm:block">
                    Bitcoin Data, Charts &amp; Tools
                  </p>
                </div>
              </Link>

              <SiteNavigation />
            </PageContainer>
          </header>

          <PageContainer width="wide" className="flex flex-1 flex-col gap-6 py-4 sm:py-5 lg:py-6">
            {children}
          </PageContainer>

          <SiteFooter locale={locale} messages={messages.site} />
        </main>
      </I18nProvider>
    </AppProviders>
  );
}
