import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import AppProviders from "../../components/AppProviders";
import AppSidebarShell from "../../components/AppSidebarShell";
import LocaleDocumentSync from "../../components/LocaleDocumentSync";
import StructuredData from "../../components/StructuredData";
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
        <Suspense fallback={<main className="min-h-screen" />}>
          <main className="min-h-screen">
            <AppSidebarShell>{children}</AppSidebarShell>
          </main>
        </Suspense>
      </I18nProvider>
    </AppProviders>
  );
}
