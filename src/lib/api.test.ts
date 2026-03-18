import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "./api";

describe("fetchJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, source: "test" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(fetchJson<{ ok: boolean; source: string }>("/api/test")).resolves.toEqual({
      ok: true,
      source: "test",
    });
  });

  it("surfaces structured API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Fehler beim Laden der Daten.",
            details: "Provider offline.",
          }),
          {
            status: 502,
            headers: { "content-type": "application/json" },
          }
        )
      )
    );

    await expect(fetchJson("/api/test")).rejects.toThrow(
      "Fehler beim Laden der Daten. Provider offline."
    );
  });

  it("maps network failures to a user friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(fetchJson("/api/test")).rejects.toThrow(
      "Netzwerkfehler. Bitte später erneut versuchen."
    );
  });
});
