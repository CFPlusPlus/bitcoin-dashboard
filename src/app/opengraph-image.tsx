import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../lib/social-image";
import { homePageMetadata } from "../lib/public-metadata";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: homePageMetadata.socialEyebrow,
    title: homePageMetadata.socialTitle,
    summary: homePageMetadata.socialSummary,
  });
}
