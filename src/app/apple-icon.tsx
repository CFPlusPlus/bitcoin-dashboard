import { createAppIconResponse } from "../lib/app-icon";

export const size = {
  width: 180,
  height: 180,
} as const;

export const contentType = "image/png";

export default function AppleIcon() {
  return createAppIconResponse(size.width);
}
