import { ImageResponse } from "next/og";

export const APP_ICON_BACKGROUND_COLOR = "#0A1620";
export const APP_ICON_THEME_COLOR = "#FF7A1A";

const APP_ICON_GRADIENT = "linear-gradient(135deg, #FF5B2A 0%, #FF7A1A 52%, #FFB15A 100%)";
const LINE_THICKNESS = 5;
const DOT_SIZE = 11.6667;

const segments = [
  {
    angle: -45,
    left: 16.6667,
    length: 37.7124,
    top: 73.3333,
  },
  {
    angle: 48.8141,
    left: 43.3333,
    length: 17.6777,
    top: 46.6667,
  },
  {
    angle: -48.3665,
    left: 55,
    length: 40.1386,
    top: 60,
  },
] as const;

function AppIconGraphic() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundColor: APP_ICON_BACKGROUND_COLOR,
      }}
    >
      {segments.map((segment) => (
        <div
          key={`${segment.left}-${segment.top}-${segment.angle}`}
          style={{
            position: "absolute",
            left: `${segment.left}%`,
            top: `${segment.top}%`,
            width: `${segment.length}%`,
            height: `${LINE_THICKNESS}%`,
            borderRadius: "999px",
            backgroundImage: APP_ICON_GRADIENT,
            transform: `translateY(-50%) rotate(${segment.angle}deg)`,
            transformOrigin: "left center",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: "75.8333%",
          top: "24.1667%",
          width: `${DOT_SIZE}%`,
          height: `${DOT_SIZE}%`,
          borderRadius: "999px",
          backgroundColor: APP_ICON_THEME_COLOR,
        }}
      />
    </div>
  );
}

export function createAppIconResponse(size: number) {
  return new ImageResponse(<AppIconGraphic />, {
    width: size,
    height: size,
  });
}
