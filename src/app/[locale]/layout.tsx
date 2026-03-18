import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import SiteNavigation from "../../components/SiteNavigation";
import StructuredData from "../../components/StructuredData";
import PageContainer from "../../components/ui/layout/PageContainer";
import { DEFAULT_LOCALE, LOCALES, getAlternateLocalePath, isValidLocale, localeMeta, type AppLocale } from "../../i18n/config";
import { I18nProvider } from "../../i18n/context";
import { getDictionary } from "../../i18n/dictionaries";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  createLayoutMetadata,
  createWebsiteSchema,
  getAbsoluteUrl,
  metadataBase,
  serializeJsonLd,
} from "../../lib/seo";

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
    <html lang={localeMeta[locale].bcp47}>
      <body className="min-h-screen bg-app text-fg antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <StructuredData
            data={serializeJsonLd(createWebsiteSchema({ locale, description: messages.metadata.defaultDescription }))}
          />
          <main className="min-h-screen py-0">
            <header className="w-full border-b border-border-default/80 bg-surface">
              <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="shrink-0 border-r border-border-subtle pr-3 font-mono text-[0.68rem] uppercase tracking-[0.26em] text-accent">
                    {messages.site.name}
                  </p>
                  <p className="truncate font-serif text-lg tracking-[-0.03em] text-fg-secondary sm:text-xl">
                    <span className="text-accent">Bitcoin</span> {messages.site.tagline}
                  </p>
                </div>

                <SiteNavigation />
              </div>
            </header>

            <PageContainer className="flex flex-col gap-5 py-4 sm:py-5">
              {children}
            </PageContainer>
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}
