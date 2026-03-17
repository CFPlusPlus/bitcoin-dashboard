import type { Metadata } from "next";

export const SITE_NAME = "Bitcoin Dashboard";
export const DEFAULT_DESCRIPTION =
  "Bitcoin Dashboard mit Marktueberblick, Netzwerkdaten, Sentiment und praktischen Bitcoin-Tools.";

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
  title: string;
};

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function createPageMetadata({ description, path, title }: PageMetadataInput): Metadata {
  const canonicalPath = normalizePath(path);

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
    },
  };
}
