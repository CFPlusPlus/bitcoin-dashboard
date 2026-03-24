import { createAppIconResponse } from "../../lib/app-icon";

export function GET() {
  return createAppIconResponse(192);
}
