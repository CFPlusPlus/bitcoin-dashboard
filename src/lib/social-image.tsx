import { ImageResponse } from "next/og";
import { SITE_NAME } from "./seo";

type SocialImageContent = {
  eyebrow: string;
  footer?: string;
  summary: string;
  title: string;
};

export const socialImageAlt = SITE_NAME;
export const socialImageSize = {
  width: 1200,
  height: 630,
} as const;
export const socialImageContentType = "image/png";

export function createSocialImageResponse({ eyebrow, footer, summary, title }: SocialImageContent) {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        background:
          "radial-gradient(circle at top right, #ff7a1a 0, rgba(255, 122, 26, 0.2) 28%, transparent 54%), linear-gradient(135deg, #09131c 0%, #102332 56%, #0c1a25 100%)",
        color: "#eaf4ff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              backgroundColor: "#ff7a1a",
              boxShadow: "0 0 32px rgba(255, 122, 26, 0.45)",
            }}
          />
          <span>{SITE_NAME}</span>
        </div>

        <div
          style={{
            display: "flex",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "999px",
            padding: "10px 18px",
            backgroundColor: "rgba(8, 19, 28, 0.45)",
            color: "#b4c7d8",
            fontSize: "22px",
          }}
        >
          btc
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "22px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#ff7a1a",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.045em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            lineHeight: 1.35,
            color: "#b4c7d8",
          }}
        >
          {summary}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#6f8697",
          fontSize: "24px",
        }}
      >
        <div style={{ display: "flex" }}>{footer ?? "Bitcoin Dashboard"}</div>
        <div style={{ display: "flex" }}>bitcoin-dashboard</div>
      </div>
    </div>,
    {
      ...socialImageSize,
    }
  );
}
