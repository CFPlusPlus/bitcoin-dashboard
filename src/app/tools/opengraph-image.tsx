import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../../lib/social-image";
import { toolsPageMetadata } from "../../lib/public-metadata";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: toolsPageMetadata.socialEyebrow,
    title: toolsPageMetadata.socialTitle,
    summary: toolsPageMetadata.socialSummary,
  });
}
