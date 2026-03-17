import type { Metadata } from "next";
import { createPageMetadata } from "../lib/seo";
import HomePage from "../views/HomePage";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description:
    "Bitcoin Dashboard mit aktuellem Marktueberblick, Preisentwicklung, Netzwerkdaten und Sentiment auf einer Seite.",
  path: "/",
});

export default function HomeRoute() {
  return <HomePage />;
}
