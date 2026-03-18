import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../../../../lib/social-image";
import { getDictionary } from "../../../../i18n/dictionaries";
import { isValidLocale } from "../../../../i18n/config";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isValidLocale(locale) ? locale : "de";
  const metadata = getDictionary(safeLocale).metadata;

  return createSocialImageResponse({
    eyebrow: metadata.dca.socialEyebrow,
    title: metadata.dca.socialTitle,
    summary: metadata.dca.socialSummary,
    footer: metadata.social.footer,
  });
}
