import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, localeMeta } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import { APP_ICON_BACKGROUND_COLOR, APP_ICON_THEME_COLOR } from "../lib/app-icon";

export default function manifest(): MetadataRoute.Manifest {
  const messages = getDictionary(DEFAULT_LOCALE);

  return {
    id: `/${DEFAULT_LOCALE}`,
    name: messages.site.name,
    short_name: "bitstats",
    description: messages.metadata.defaultDescription,
    start_url: `/${DEFAULT_LOCALE}`,
    scope: "/",
    display: "standalone",
    background_color: APP_ICON_BACKGROUND_COLOR,
    theme_color: APP_ICON_THEME_COLOR,
    lang: localeMeta[DEFAULT_LOCALE].bcp47,
    icons: [
      {
        src: "/pwa-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
