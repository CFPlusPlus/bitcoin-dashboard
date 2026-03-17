import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../lib/social-image";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: "Dashboard",
    title: "Bitcoin Dashboard",
    summary: "Marktueberblick, Netzwerkdaten, Sentiment und praktische Bitcoin-Tools in einer klaren Struktur.",
  });
}
