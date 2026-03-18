import {
  createSocialImageResponse,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "../../../lib/social-image";
import { dcaCalculatorMetadata } from "../../../lib/public-metadata";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    eyebrow: dcaCalculatorMetadata.socialEyebrow,
    title: dcaCalculatorMetadata.socialTitle,
    summary: dcaCalculatorMetadata.socialSummary,
  });
}
