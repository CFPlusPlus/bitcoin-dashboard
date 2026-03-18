import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "../../../i18n/config";

export default function DcaRedirectPage() {
  redirect(`/${DEFAULT_LOCALE}/tools/dca-rechner`);
}
