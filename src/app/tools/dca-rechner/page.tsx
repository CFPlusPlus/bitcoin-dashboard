import type { Metadata } from "next";
import "../../../styles/dca-calculator-layout.css";
import "../../../styles/dca-calculator-form.css";
import StructuredData from "../../../components/StructuredData";
import { dcaCalculatorMetadata } from "../../../lib/public-metadata";
import {
  createPageMetadata,
  createSoftwareApplicationSchema,
  serializeJsonLd,
} from "../../../lib/seo";
import DcaCalculatorPage from "../../../views/DcaCalculatorPage";

export const metadata: Metadata = createPageMetadata({
  title: dcaCalculatorMetadata.title,
  description: dcaCalculatorMetadata.description,
  path: dcaCalculatorMetadata.path,
});

export default function DcaCalculatorRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createSoftwareApplicationSchema({
            name: dcaCalculatorMetadata.schemaName,
            description: dcaCalculatorMetadata.description,
            path: dcaCalculatorMetadata.path,
          })
        )}
      />
      <DcaCalculatorPage />
    </>
  );
}
