import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../../lib/social-image";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: "Tools",
    title: "Bitcoin-Tools",
    summary: "Interaktive Rechner und Experimente fuer Bitcoin, mit Platz fuer Eingaben, Kontext und Ergebnisse.",
  });
}
