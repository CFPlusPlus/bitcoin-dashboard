import { describe, expect, it } from "vitest";
import {
  createCollectionPageSchema,
  createPageMetadata,
  createSoftwareApplicationSchema,
  createWebsiteSchema,
  serializeJsonLd,
} from "./seo";

describe("seo helpers", () => {
  it("adds social preview metadata for public pages", () => {
    const metadata = createPageMetadata({
      locale: "en",
      title: "Tools",
      description: "Bitcoin tools overview",
      path: "/tools",
    });

    expect(metadata.alternates?.canonical).toBe("/en/tools");
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "http://localhost:3000/tools/opengraph-image",
      }),
    ]);
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        images: ["http://localhost:3000/tools/opengraph-image"],
      })
    );
  });

  it("creates focused structured data for site and pages", () => {
    expect(createWebsiteSchema({ locale: "de", description: "Bitcoin dashboard" })).toEqual(
      expect.objectContaining({
        "@type": "WebSite",
        url: "http://localhost:3000/de",
      })
    );

    expect(
      createCollectionPageSchema({
        locale: "en",
        name: "Bitcoin-Tools",
        description: "Interactive tools",
        path: "/tools",
        items: [{ name: "DCA-Rechner", path: "/tools/dca-rechner" }],
      })
    ).toEqual(
      expect.objectContaining({
        "@type": "CollectionPage",
        hasPart: [
          expect.objectContaining({
            name: "DCA-Rechner",
            url: "http://localhost:3000/en/tools/dca-rechner",
          }),
        ],
      })
    );

    expect(
      createSoftwareApplicationSchema({
        locale: "en",
        name: "Bitcoin DCA-Rechner",
        description: "Track average buy price",
        path: "/tools/dca-rechner",
      })
    ).toEqual(
      expect.objectContaining({
        "@type": "SoftwareApplication",
        applicationCategory: "FinanceApplication",
      })
    );
  });

  it("serializes json-ld safely", () => {
    expect(serializeJsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: "<btc>" }))
      .toContain("\\u003cbtc>");
  });
});
