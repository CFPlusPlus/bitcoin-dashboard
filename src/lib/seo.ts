import type { Metadata } from "next";

export const SITE_NAME = "Bitcoin Dashboard";
export const DEFAULT_DESCRIPTION =
  "Bitcoin-Dashboard mit Preis, Marktstruktur, Netzwerkdaten, Sentiment und fokussierten Bitcoin-Tools.";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";

const DEFAULT_LOCALE = "de_DE";
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
  path,
  socialImagePath,
  title,
}: PageMetadataInput): Metadata {
  const canonicalPath = normalizePath(path);
  const socialImageUrl = buildSocialImageUrl(
    socialImagePath ??
      (path === "/" ? DEFAULT_SOCIAL_IMAGE_PATH : `${canonicalPath}/opengraph-image`)
  );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
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

export function createWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: getAbsoluteUrl("/"),
    inLanguage: "de-DE",
  } as const;
}

export function createWebPageSchema({
  description,
  name,
  path,
}: {
  description: string;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: getAbsoluteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getAbsoluteUrl("/"),
    },
    inLanguage: "de-DE",
  } as const;
}

export function createCollectionPageSchema({
  description,
  items,
  name,
  path,
}: {
  description: string;
  items: Array<{ name: string; path: string }>;
  name: string;
  path: string;
}) {
  return {
    ...createWebPageSchema({ description, name, path }),
    "@type": "CollectionPage",
    hasPart: items.map((item) => ({
      "@type": "WebPage",
      name: item.name,
      url: getAbsoluteUrl(item.path),
    })),
  } as const;
}

export function createSoftwareApplicationSchema({
  description,
  name,
  path,
}: {
  description: string;
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
    url: getAbsoluteUrl(path),
    inLanguage: "de-DE",
  } as const;
}

export function serializeJsonLd(input: SchemaWithContext | SchemaWithContext[]) {
  return JSON.stringify(input).replace(/</g, "\\u003c");
}
