import manifest from "./manifest";

describe("manifest", () => {
  it("exposes install metadata for the default locale app shell", () => {
    const result = manifest();

    expect(result.id).toBe("/de");
    expect(result.start_url).toBe("/de");
    expect(result.display).toBe("standalone");
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/pwa-192",
          sizes: "192x192",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/pwa-512",
          sizes: "512x512",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
        }),
      ])
    );
  });
});
