import type { Metadata } from "next";
import StructuredData from "../../../components/StructuredData";
import {
  createPageMetadata,
  createSoftwareApplicationSchema,
  serializeJsonLd,
} from "../../../lib/seo";
import DcaCalculatorPage from "../../../views/DcaCalculatorPage";

const description =
  "DCA-Rechner fuer Bitcoin: Kaeufe erfassen, Durchschnittskaufpreis berechnen und den Einstieg mit dem aktuellen Marktpreis vergleichen.";

export const metadata: Metadata = createPageMetadata({
  title: "DCA-Rechner",
  description,
  path: "/tools/dca-rechner",
});

export default function DcaCalculatorRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createSoftwareApplicationSchema({
            name: "Bitcoin DCA-Rechner",
            description,
            path: "/tools/dca-rechner",
          })
        )}
      />
      <DcaCalculatorPage />
    </>
  );
}
