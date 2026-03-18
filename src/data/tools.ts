import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";

export function getToolCards(locale: AppLocale) {
  const dictionary = getDictionary(locale);

  return [dictionary.tools.dca] as const;
}
