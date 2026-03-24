"use client";

import { type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { formatCurrency } from "../lib/format";
import type { Currency } from "../types/dashboard";

export type LivePricePoint = {
  price: number;
  timestamp: number;
};

type LivePriceSparklineProps = {
  currency: Currency;
  performancePercent: number | null;
  points: LivePricePoint[];
};

const LIVE_WINDOW_MS = 30_000;
const HISTORY_BUFFER_MS = 6_000;
const AXIS_TICK_MS = 5_000;
const Y_AXIS_PADDING_RATIO = 0.055;
const Y_AXIS_MIN_PADDING_RATIO = 0.00008;
const Y_AXIS_MIN_PADDING_ABSOLUTE = 1.2;
const DISPLAY_SPRING_STIFFNESS = 62;
const DISPLAY_SPRING_DAMPING = 22;
const DISPLAY_SETTLE_VELOCITY = 0.018;
const DISPLAY_SETTLE_DISTANCE = 0.08;
const SAMPLE_INTERVAL_MS = 1000 / 48;
const LIVE_DOT_RADIUS = 7;
const MAX_FRAME_GAP_MS = 250;
const MAX_FRAME_DELTA_SECONDS = 1 / 20;

function formatTimeLabel(timestamp: number, locale: "de" | "en") {
  const code = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(code, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function formatHoverDateLabel(timestamp: number, locale: "de" | "en") {
  const code = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(code, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length; index += 1) {
    path += ` L ${points[index].x.toFixed(2)} ${points[index].y.toFixed(2)}`;
  }

  return path;
}

function getTooltipWidth(valueLabel: string, dateLabel: string) {
  const longestLine = Math.max(valueLabel.length, dateLabel.length);
  return Math.min(Math.max(longestLine * 7.4 + 20, 96), 150);
}

function getTooltipY({
  pointY,
  tooltipHeight,
  preferredOffset,
  fallbackOffset,
  minY,
  maxY,
}: {
  pointY: number;
  tooltipHeight: number;
  preferredOffset: number;
  fallbackOffset: number;
  minY: number;
  maxY: number;
}) {
  const aboveY = pointY - tooltipHeight - preferredOffset;

  if (aboveY >= minY) {
    return aboveY;
  }

  return Math.min(pointY + fallbackOffset, maxY);
}

function getChartTheme(performancePercent: number | null) {
  if (typeof performancePercent === "number" && performancePercent < 0) {
    return {
      areaEnd: "color-mix(in srgb, var(--token-color-danger) 3%, transparent)",
      areaStart: "color-mix(in srgb, var(--token-color-danger) 24%, transparent)",
      dot: "color-mix(in srgb, var(--token-color-danger) 68%, white)",
      dotStroke: "var(--token-color-danger)",
      guide:
        "color-mix(in srgb, var(--token-color-accent-primary) 58%, var(--token-color-warning) 42%)",
      lineEnd:
        "color-mix(in srgb, var(--token-color-accent-primary) 82%, var(--token-color-danger) 18%)",
      lineStart: "var(--token-color-danger)",
    };
  }

  if (typeof performancePercent === "number" && performancePercent > 0) {
    return {
      areaEnd: "color-mix(in srgb, var(--token-color-success) 3%, transparent)",
      areaStart: "color-mix(in srgb, var(--token-color-success) 28%, transparent)",
      dot: "color-mix(in srgb, var(--token-color-success) 72%, white)",
      dotStroke: "var(--token-color-success)",
      guide:
        "color-mix(in srgb, var(--token-color-accent-primary) 58%, var(--token-color-warning) 42%)",
      lineEnd: "color-mix(in srgb, var(--token-color-info) 24%, var(--token-color-success) 76%)",
      lineStart: "var(--token-color-success)",
    };
  }

  return {
    areaEnd: "color-mix(in srgb, var(--token-color-accent-primary) 3%, transparent)",
    areaStart: "color-mix(in srgb, var(--token-color-accent-primary) 24%, transparent)",
    dot: "var(--token-color-accent-strong)",
    dotStroke: "var(--token-color-accent-primary)",
    guide:
      "color-mix(in srgb, var(--token-color-accent-primary) 62%, var(--token-color-warning) 38%)",
    lineEnd: "var(--token-color-accent-strong)",
    lineStart: "var(--token-color-accent-primary)",
  };
}

function buildMovingTimeTicks(now: number, chartWidth: number, paddingLeft: number) {
  const visibleStart = now - LIVE_WINDOW_MS;
  const firstTick = Math.floor(visibleStart / AXIS_TICK_MS) * AXIS_TICK_MS;
  const ticks: Array<{ timestamp: number; x: number }> = [];

  for (let timestamp = firstTick; timestamp <= now + AXIS_TICK_MS; timestamp += AXIS_TICK_MS) {
    if (timestamp < visibleStart || timestamp > now) {
      continue;
    }

    const progress = (timestamp - visibleStart) / LIVE_WINDOW_MS;
    ticks.push({
      timestamp,
      x: paddingLeft + chartWidth * progress,
    });
  }

  return ticks;
}

export default function LivePriceSparkline({ currency, points }: LivePriceSparklineProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.overview;
  const [now, setNow] = useState(() => Date.now());
  const [renderedPoints, setRenderedPoints] = useState<LivePricePoint[]>([]);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const targetPriceRef = useRef<number | null>(null);
  const currentRenderedPriceRef = useRef<number | null>(null);
  const renderedVelocityRef = useRef(0);
  const idPrefix = useId().replace(/:/g, "");
  const width = 920;
  const height = 320;
  const paddingLeft = 18;
  const paddingRight = 108;
  const paddingTop = 16;
  const paddingBottom = 40;

  const latestSourcePoint = points[points.length - 1] ?? null;

  useEffect(() => {
    if (!latestSourcePoint) return;

    targetPriceRef.current = latestSourcePoint.price;

    if (currentRenderedPriceRef.current === null) {
      currentRenderedPriceRef.current = latestSourcePoint.price;
      renderedVelocityRef.current = 0;
    }
  }, [latestSourcePoint]);

  useEffect(() => {
    const renderFrame = (frameTime: number) => {
      const targetPrice = targetPriceRef.current;
      const currentPrice = currentRenderedPriceRef.current;
      const previousFrameTime = lastFrameTimeRef.current;
      const deltaSeconds =
        previousFrameTime === null
          ? SAMPLE_INTERVAL_MS / 1000
          : Math.min((frameTime - previousFrameTime) / 1000, MAX_FRAME_DELTA_SECONDS);

      lastFrameTimeRef.current = frameTime;

      if (targetPrice !== null && currentPrice !== null) {
        const displacement = targetPrice - currentPrice;
        const springForce = displacement * DISPLAY_SPRING_STIFFNESS;
        const dampingForce = renderedVelocityRef.current * DISPLAY_SPRING_DAMPING;
        const acceleration = springForce - dampingForce;
        const nextVelocity = renderedVelocityRef.current + acceleration * deltaSeconds;
        const nextRenderedPrice = currentPrice + nextVelocity * deltaSeconds;

        renderedVelocityRef.current = nextVelocity;
        currentRenderedPriceRef.current = nextRenderedPrice;

        if (
          Math.abs(targetPrice - nextRenderedPrice) <= DISPLAY_SETTLE_DISTANCE &&
          Math.abs(nextVelocity) <= DISPLAY_SETTLE_VELOCITY
        ) {
          currentRenderedPriceRef.current = targetPrice;
          renderedVelocityRef.current = 0;
        }
      } else if (targetPrice !== null) {
        currentRenderedPriceRef.current = targetPrice;
        renderedVelocityRef.current = 0;
      }

      if (
        currentRenderedPriceRef.current !== null &&
        lastSampleTimeRef.current !== 0 &&
        frameTime - lastSampleTimeRef.current > MAX_FRAME_GAP_MS
      ) {
        const resumedPrice = currentRenderedPriceRef.current;
        const seedStart = frameTime - SAMPLE_INTERVAL_MS * 2;

        lastSampleTimeRef.current = frameTime;
        lastFrameTimeRef.current = frameTime;
        renderedVelocityRef.current = 0;
        setNow(frameTime);
        setRenderedPoints([
          {
            price: resumedPrice,
            timestamp: seedStart,
          },
          {
            price: resumedPrice,
            timestamp: seedStart + SAMPLE_INTERVAL_MS,
          },
          {
            price: resumedPrice,
            timestamp: frameTime,
          },
        ]);

        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }

      if (
        currentRenderedPriceRef.current !== null &&
        (lastSampleTimeRef.current === 0 ||
          frameTime - lastSampleTimeRef.current >= SAMPLE_INTERVAL_MS)
      ) {
        const sampleTimestamp = frameTime;
        const samplePrice = currentRenderedPriceRef.current;

        lastSampleTimeRef.current = sampleTimestamp;
        setNow(sampleTimestamp);
        setRenderedPoints((currentPoints) => {
          const nextPoints = [
            ...currentPoints,
            {
              price: samplePrice,
              timestamp: sampleTimestamp,
            },
          ];

          return nextPoints.filter(
            (point) => point.timestamp >= sampleTimestamp - LIVE_WINDOW_MS - HISTORY_BUFFER_MS
          );
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      lastFrameTimeRef.current = null;
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const displayPoints = renderedPoints;
  const visibleEnd = now;
  const visibleStart = visibleEnd - LIVE_WINDOW_MS;
  const usablePoints = displayPoints.filter(
    (point) => point.timestamp >= visibleStart - AXIS_TICK_MS && point.timestamp <= visibleEnd
  );

  if (usablePoints.length < 2) {
    return (
      <div className="flex h-[7.5rem] items-center justify-center border border-dashed border-border-subtle bg-surface/70 px-4 text-sm text-fg-muted">
        {copy.liveChartEmpty}
      </div>
    );
  }

  const axisSourcePoints = displayPoints.length > 0 ? displayPoints : usablePoints;
  const prices = axisSourcePoints.length > 0 ? axisSourcePoints.map((point) => point.price) : [0];
  const firstVisiblePoint = usablePoints[0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const latestPoint = usablePoints[usablePoints.length - 1];
  const visiblePerformancePercent =
    firstVisiblePoint.price === 0
      ? 0
      : ((latestPoint.price - firstVisiblePoint.price) / firstVisiblePoint.price) * 100;
  const theme = getChartTheme(visiblePerformancePercent);
  const rawDelta = maxPrice - minPrice;
  const paddedDelta = Math.max(
    rawDelta * Y_AXIS_PADDING_RATIO,
    maxPrice * Y_AXIS_MIN_PADDING_RATIO,
    Y_AXIS_MIN_PADDING_ABSOLUTE
  );
  const axisMin = minPrice - paddedDelta;
  const axisMax = maxPrice + paddedDelta;
  const axisDelta = axisMax - axisMin || 1;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const xTicks = buildMovingTimeTicks(visibleEnd, chartWidth, paddingLeft);

  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const value = axisMax - axisDelta * ratio;
    return {
      label: formatCurrency(value, currency, locale),
      value,
      y: paddingTop + chartHeight * ratio,
    };
  });

  const getX = (timestamp: number) =>
    paddingLeft + ((timestamp - visibleStart) / LIVE_WINDOW_MS) * chartWidth;

  const getY = (price: number) => {
    const normalized = (price - axisMin) / axisDelta;
    return height - paddingBottom - normalized * chartHeight;
  };

  const pathSourcePoints = displayPoints.filter(
    (point) =>
      point.timestamp >= visibleStart - AXIS_TICK_MS && point.timestamp <= visibleEnd + AXIS_TICK_MS
  );
  const chartPoints = pathSourcePoints.map((point) => ({
    x: getX(point.timestamp),
    y: getY(point.price),
  }));
  const hoverablePoints = usablePoints.map((point) => ({
    ...point,
    x: getX(point.timestamp),
    y: getY(point.price),
  }));
  const linePath = buildLinePath(chartPoints);
  const firstX = chartPoints[0]?.x ?? paddingLeft;
  const lastX = chartPoints[chartPoints.length - 1]?.x ?? width - paddingRight;
  const lastY = getY(latestPoint.price);
  const baseY = height - paddingBottom;
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;
  const activeHoveredPoint =
    hoveredTimestamp === null
      ? null
      : (hoverablePoints.find((point) => point.timestamp === hoveredTimestamp) ?? null);
  const tooltipValueLabel = activeHoveredPoint
    ? formatCurrency(activeHoveredPoint.price, currency, locale)
    : "";
  const tooltipDateLabel = activeHoveredPoint
    ? formatHoverDateLabel(activeHoveredPoint.timestamp, locale)
    : "";
  const tooltipWidth = getTooltipWidth(tooltipValueLabel, tooltipDateLabel);
  const tooltipHeight = 46;
  const tooltipX = activeHoveredPoint
    ? Math.min(Math.max(activeHoveredPoint.x - tooltipWidth / 2, 10), width - tooltipWidth - 10)
    : 0;
  const tooltipY = activeHoveredPoint
    ? getTooltipY({
        pointY: activeHoveredPoint.y,
        tooltipHeight,
        preferredOffset: 32,
        fallbackOffset: 18,
        minY: 10,
        maxY: height - paddingBottom - tooltipHeight - 8,
      })
    : 0;

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    if (hoverablePoints.length === 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;

    const pointerX = paddingLeft + ((event.clientX - bounds.left) / bounds.width) * chartWidth;
    const clampedX = Math.min(Math.max(pointerX, paddingLeft), paddingLeft + chartWidth);
    const closestPoint = hoverablePoints.reduce((closest, point) =>
      Math.abs(point.x - clampedX) < Math.abs(closest.x - clampedX) ? point : closest
    );

    setHoveredTimestamp(closestPoint.timestamp);
  }

  function handlePointerLeave() {
    setHoveredTimestamp(null);
  }

  return (
    <div
      className="relative isolate overflow-hidden border p-4 sm:p-5"
      style={{
        borderColor: "color-mix(in srgb, var(--token-color-border-default) 75%, transparent)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--token-color-text-primary) 2.2%, transparent) 0%, color-mix(in srgb, var(--token-color-text-primary) 0.6%, transparent) 100%), linear-gradient(125deg, color-mix(in srgb, var(--token-color-accent-primary) 10%, transparent) 0%, color-mix(in srgb, var(--token-color-info) 8%, transparent) 22%, transparent 48%), linear-gradient(180deg, color-mix(in srgb, var(--token-color-bg-elevated) 86%, black 14%), color-mix(in srgb, var(--token-color-bg-app) 88%, black 12%))",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--token-color-text-primary) 18%, transparent), transparent)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--token-color-accent-primary) 22%, transparent), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, var(--token-color-text-primary) 10%, transparent), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "repeating-linear-gradient(90deg, color-mix(in srgb, var(--token-color-text-primary) 1.2%, transparent) 0, color-mix(in srgb, var(--token-color-text-primary) 1.2%, transparent) 1px, transparent 1px, transparent 72px)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--token-color-bg-app) 18%, transparent) 100%)",
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
          <span>{copy.liveChartLabel}</span>
          <span>{copy.liveWindow}</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-[17rem] w-full sm:h-[19rem]"
          role="img"
          aria-label={copy.liveChartAriaLabel}
        >
          <defs>
            <clipPath id={`${idPrefix}-live-chart-clip`}>
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={chartWidth + LIVE_DOT_RADIUS + 4}
                height={chartHeight}
              />
            </clipPath>
            <linearGradient id={`${idPrefix}-live-area-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.areaStart} />
              <stop offset="100%" stopColor={theme.areaEnd} />
            </linearGradient>
            <linearGradient id={`${idPrefix}-live-line-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.lineStart} />
              <stop offset="100%" stopColor={theme.lineEnd} />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={`${tick.value}`}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight + 6}
                y2={tick.y}
                stroke="color-mix(in srgb, var(--token-color-text-primary) 7%, transparent)"
                strokeWidth="1"
              />
              <text
                x={width - paddingRight + 18}
                y={tick.y + 4}
                fill="var(--token-color-text-muted)"
                fontSize="15"
                textAnchor="start"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text
              key={`${tick.timestamp}`}
              x={tick.x}
              y={height - 8}
              fill="var(--token-color-text-muted)"
              fontSize="14"
              textAnchor="middle"
            >
              {formatTimeLabel(tick.timestamp, locale)}
            </text>
          ))}

          <line
            x1={paddingLeft}
            y1={lastY}
            x2={width - paddingRight + 2}
            y2={lastY}
            stroke={theme.guide}
            strokeDasharray="8 10"
            strokeWidth="1.2"
            opacity="0.75"
          />
          <g clipPath={`url(#${idPrefix}-live-chart-clip)`}>
            <path d={areaPath} fill={`url(#${idPrefix}-live-area-fill)`} />
            <path
              d={linePath}
              fill="none"
              stroke="color-mix(in srgb, var(--token-color-bg-app) 56%, transparent)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${idPrefix}-live-line-stroke)`}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {activeHoveredPoint ? (
              <>
                <line
                  x1={activeHoveredPoint.x}
                  y1={paddingTop}
                  x2={activeHoveredPoint.x}
                  y2={baseY}
                  stroke="color-mix(in srgb, var(--token-color-text-primary) 22%, transparent)"
                  strokeDasharray="5 7"
                  strokeWidth="1"
                />
                <circle
                  cx={activeHoveredPoint.x}
                  cy={activeHoveredPoint.y}
                  r="8"
                  fill="color-mix(in srgb, var(--token-color-bg-app) 86%, black)"
                  stroke={theme.dotStroke}
                  strokeWidth="2.5"
                />
                <circle
                  cx={activeHoveredPoint.x}
                  cy={activeHoveredPoint.y}
                  r="3.5"
                  fill={theme.dot}
                />
              </>
            ) : null}
            <circle
              cx={chartPoints[chartPoints.length - 1].x}
              cy={lastY}
              r={LIVE_DOT_RADIUS}
              fill="color-mix(in srgb, var(--token-color-bg-app) 84%, black)"
              stroke={theme.dotStroke}
              strokeWidth="3"
            />
            <circle
              cx={chartPoints[chartPoints.length - 1].x}
              cy={lastY}
              r="3.5"
              fill={theme.dot}
            />
          </g>
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            className="cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
          {activeHoveredPoint ? (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                fill="color-mix(in srgb, var(--token-color-bg-app) 90%, black)"
                stroke="color-mix(in srgb, var(--token-color-accent-primary) 28%, transparent)"
              />
              <text
                x={tooltipX + 10}
                y={tooltipY + 18}
                fill="var(--token-color-text-primary)"
                fontSize="13"
                fontWeight="600"
              >
                {tooltipValueLabel}
              </text>
              <text
                x={tooltipX + 10}
                y={tooltipY + 33}
                fill="var(--token-color-text-muted)"
                fontSize="11.5"
              >
                {tooltipDateLabel}
              </text>
            </g>
          ) : null}
        </svg>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle/80 pt-3 text-sm text-fg-muted">
          <span>
            {copy.liveCoverageStart}: {formatTimeLabel(visibleStart, locale)}
          </span>
          <span>
            {copy.liveCoverageEnd}: {formatTimeLabel(visibleEnd, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
