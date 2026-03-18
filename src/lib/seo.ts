import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, getAlternateLocalePath, localeMeta, type AppLocale } from "../i18n/config";

export const SITE_NAME = "Bitcoin Dashboard";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";
const LOCAL_DEVELOPMENT_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  const withProtocol = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;

  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}

function resolveSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.CF_PAGES_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  return normalizeSiteUrl(configuredUrl ?? LOCAL_DEVELOPMENT_URL);
}

export const metadataBase = new URL(resolveSiteUrl());

type PageMetadataInput = {
  description: string;
  locale: AppLocale;
  path: string;
  socialImagePath?: string;
  title: string;
};

type Thing = Record<string, unknown>;

type SchemaWithContext =
  | {
      "@context": "https://schema.org";
      "@type": string;
    }
  | Thing;

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function getAbsoluteUrl(path = "/") {
  return new URL(normalizePath(path), metadataBase).toString();
}

function buildSocialImageUrl(path?: string) {
  return getAbsoluteUrl(path ?? DEFAULT_SOCIAL_IMAGE_PATH);
}

export function createPageMetadata({
  description,
  locale,
  path,
  socialImagePath,
  title,
}: PageMetadataInput): Metadata {
  const canonicalPath = normalizePath(path);
  const socialImageUrl = buildSocialImageUrl(
    socialImagePath ??
      (path === "/"
        ? getAlternateLocalePath("/opengraph-image", locale)
        : getAlternateLocalePath(`${canonicalPath}/opengraph-image`, locale))
  );

  return {
    title,
    description,
    alternates: {
      canonical: getAlternateLocalePath(canonicalPath, locale),
      languages: Object.fromEntries(
        LOCALES.map((entry) => [localeMeta[entry].bcp47, getAlternateLocalePath(canonicalPath, entry)])
      ),
    },
    openGraph: {
      title,
      description,
      url: getAlternateLocalePath(canonicalPath, locale),
      siteName: SITE_NAME,
      locale: localeMeta[locale].og,
      type: "website",
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
  };
}

export function createLayoutMetadata({
  description,
  locale,
  title,
}: {
  description: string;
  locale: AppLocale;
  title: string;
}): Metadata {
  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((entry) => [localeMeta[entry].bcp47, `/${entry}`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: title,
      locale: localeMeta[locale].og,
      type: "website",
      images: [
        {
          url: getAbsoluteUrl(getAlternateLocalePath("/opengraph-image", locale)),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getAbsoluteUrl(getAlternateLocalePath("/opengraph-image", locale))],
    },
  };
}

export function createWebsiteSchema({
  description,
  locale,
}: {
  description: string;
  locale: AppLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description,
    url: getAbsoluteUrl(`/${locale}`),
    inLanguage: localeMeta[locale].bcp47,
  } as const;
}

export function createWebPageSchema({
  description,
  locale,
  name,
  path,
}: {
  description: string;
  locale: AppLocale;
  name: string;
  path: string;
}) {
  const localizedPath = getAlternateLocalePath(path, locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: getAbsoluteUrl(localizedPath),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getAbsoluteUrl(`/${locale}`),
    },
    inLanguage: localeMeta[locale].bcp47,
  } as const;
}

export function createCollectionPageSchema({
  description,
  items,
  locale,
  name,
  path,
}: {
  description: string;
  items: Array<{ name: string; path: string }>;
  locale: AppLocale;
  name: string;
  path: string;
}) {
  return {
    ...createWebPageSchema({ description, locale, name, path }),
    "@type": "CollectionPage",
    hasPart: items.map((item) => ({
      "@type": "WebPage",
      name: item.name,
      url: getAbsoluteUrl(getAlternateLocalePath(item.path, locale)),
    })),
  } as const;
}

export function createSoftwareApplicationSchema({
  description,
  locale,
  name,
  path,
}: {
  description: string;
  locale: AppLocale;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: getAbsoluteUrl(getAlternateLocalePath(path, locale)),
    inLanguage: localeMeta[locale].bcp47,
  } as const;
}

export function serializeJsonLd(input: SchemaWithContext | SchemaWithContext[]) {
  return JSON.stringify(input).replace(/</g, "\\u003c");
}
