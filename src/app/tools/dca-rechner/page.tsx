import type { Metadata } from "next";
import { createPageMetadata } from "../../../lib/seo";
import DcaCalculatorPage from "../../../views/DcaCalculatorPage";

export const metadata: Metadata = createPageMetadata({
  title: "DCA-Rechner",
  description:
    "DCA-Rechner fuer Bitcoin: Kaeufe erfassen, Durchschnittskaufpreis berechnen und den Einstieg mit dem aktuellen Marktpreis vergleichen.",
  path: "/tools/dca-rechner",
});

export default function DcaCalculatorRoute() {
  return <DcaCalculatorPage />;
}
