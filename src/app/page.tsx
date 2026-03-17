import type { Metadata } from "next";
import StructuredData from "../components/StructuredData";
import { createPageMetadata } from "../lib/seo";
import { createWebPageSchema, serializeJsonLd } from "../lib/seo";
import HomePage from "../views/HomePage";

const description =
  "Bitcoin Dashboard mit aktuellem Marktueberblick, Preisentwicklung, Netzwerkdaten und Sentiment auf einer Seite.";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description,
  path: "/",
});

export default function HomeRoute() {
  return (
    <>
      <StructuredData
        data={serializeJsonLd(
          createWebPageSchema({
            name: "Bitcoin Dashboard",
            description,
            path: "/",
          })
        )}
      />
      <HomePage />
    </>
  );
}
