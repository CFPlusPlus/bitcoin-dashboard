import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../../../lib/social-image";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: "Tool",
    title: "DCA-Rechner",
    summary: "Durchschnittskaufpreis, Bestand und Performance deiner Bitcoin-Kaeufe schnell vergleichen.",
  });
}
