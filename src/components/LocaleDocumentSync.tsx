"use client";

import { useEffect } from "react";
import type { AppLocale } from "../i18n/config";
import { LOCALE_COOKIE_NAME, localeMeta } from "../i18n/config";

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export default function LocaleDocumentSync({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = localeMeta[locale].bcp47;
    document.cookie =
      `${LOCALE_COOKIE_NAME}=${locale}; ` +
      `max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax`;
  }, [locale]);

  return null;
}
