"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const PRIMARY_SMOOTHING_ALPHA = 0.2;
const SECONDARY_SMOOTHING_ALPHA = 0.14;
const CURVE_SAMPLES_PER_SEGMENT = 12;
const DISPLAY_EASING = 0.18;
const SAMPLE_INTERVAL_MS = 1000 / 48;
const LIVE_DOT_RADIUS = 7;
const MAX_FRAME_GAP_MS = 250;

function formatTimeLabel(timestamp: number, locale: "de" | "en") {
  const code = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(code, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const control1X = current.x + (next.x - previous.x) / 6;
    const control1Y = current.y + (next.y - previous.y) / 6;
    const control2X = next.x - (afterNext.x - current.x) / 6;
    const control2Y = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${control1X.toFixed(2)} ${control1Y.toFixed(2)}, ${control2X.toFixed(2)} ${control2Y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

function interpolateCurvePoints(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return points;
  }

  const curvePoints: Array<{ x: number; y: number }> = [points[0]];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    for (let sample = 1; sample <= CURVE_SAMPLES_PER_SEGMENT; sample += 1) {
      const t = sample / CURVE_SAMPLES_PER_SEGMENT;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      curvePoints.push({ x, y });
    }
  }

  return curvePoints;
}

function getChartTheme(performancePercent: number | null) {
  if (typeof performancePercent === "number" && performancePercent < 0) {
    return {
      areaEnd: "rgba(239,68,68,0.02)",
      areaStart: "rgba(239,68,68,0.24)",
      dot: "#fb7185",
      dotStroke: "#ef4444",
      guide: "#d68c25",
      lineEnd: "#f97316",
      lineStart: "#ef4444",
    };
  }

  if (typeof performancePercent === "number" && performancePercent > 0) {
    return {
      areaEnd: "rgba(34,197,94,0.02)",
      areaStart: "rgba(34,197,94,0.28)",
      dot: "#25db77",
      dotStroke: "#22c55e",
      guide: "#d68c25",
      lineEnd: "#34d399",
      lineStart: "#25db77",
    };
  }

  return {
    areaEnd: "rgba(242,143,45,0.02)",
    areaStart: "rgba(242,143,45,0.24)",
    dot: "#f2a64d",
    dotStroke: "#f28f2d",
    guide: "#d68c25",
    lineEnd: "#f6b05d",
    lineStart: "#f28f2d",
  };
}

function getLatestTimestamp(points: LivePricePoint[]) {
  const latestPoint = points[points.length - 1];
  return latestPoint?.timestamp ?? Date.now();
}

function applyForwardSmoothing(points: LivePricePoint[], alpha: number) {
  const smoothedPoints: LivePricePoint[] = [];

  for (const point of points) {
    const previousPoint = smoothedPoints[smoothedPoints.length - 1];
    const price =
      previousPoint === undefined
        ? point.price
        : previousPoint.price + (point.price - previousPoint.price) * alpha;

    smoothedPoints.push({
      price,
      timestamp: point.timestamp,
    });
  }

  return smoothedPoints;
}

function buildStablePoints(points: LivePricePoint[]) {
  const sortedPoints = [...points].sort((left, right) => left.timestamp - right.timestamp);
  const primarySmoothed = applyForwardSmoothing(sortedPoints, PRIMARY_SMOOTHING_ALPHA);
  return applyForwardSmoothing(primarySmoothed, SECONDARY_SMOOTHING_ALPHA);
}

function buildMovingTimeTicks(now: number, chartWidth: number, paddingLeft: number) {
  const visibleStart = now - LIVE_WINDOW_MS;
  const firstTick = Math.floor(visibleStart / AXIS_TICK_MS) * AXIS_TICK_MS;
  const ticks: Array<{ timestamp: number; x: number }> = [];

  for (
    let timestamp = firstTick;
    timestamp <= now + AXIS_TICK_MS;
    timestamp += AXIS_TICK_MS
  ) {
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

export default function LivePriceSparkline({
  currency,
  performancePercent,
  points,
}: LivePriceSparklineProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.overview;
  const [now, setNow] = useState(() => Date.now());
  const [renderedPoints, setRenderedPoints] = useState<LivePricePoint[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const targetPriceRef = useRef<number | null>(null);
  const currentRenderedPriceRef = useRef<number | null>(null);
  const width = 920;
  const height = 320;
  const paddingLeft = 18;
  const paddingRight = 108;
  const paddingTop = 16;
  const paddingBottom = 40;
  const theme = getChartTheme(performancePercent);

  const stablePoints = useMemo(() => buildStablePoints(points), [points]);
  const latestSourcePoint = stablePoints[stablePoints.length - 1] ?? null;

  useEffect(() => {
    if (!latestSourcePoint) return;

    targetPriceRef.current = latestSourcePoint.price;

    if (currentRenderedPriceRef.current === null) {
      currentRenderedPriceRef.current = latestSourcePoint.price;
    }
  }, [latestSourcePoint]);

  useEffect(() => {
    const renderFrame = (frameTime: number) => {
      const targetPrice = targetPriceRef.current;
      const currentPrice = currentRenderedPriceRef.current;

      if (targetPrice !== null) {
        const nextRenderedPrice =
          currentPrice === null
            ? targetPrice
            : currentPrice + (targetPrice - currentPrice) * DISPLAY_EASING;

        currentRenderedPriceRef.current = nextRenderedPrice;
      }

      if (
        currentRenderedPriceRef.current !== null &&
        lastSampleTimeRef.current !== 0 &&
        frameTime - lastSampleTimeRef.current > MAX_FRAME_GAP_MS
      ) {
        const resumedPrice = currentRenderedPriceRef.current;
        const seedStart = frameTime - SAMPLE_INTERVAL_MS * 2;

        lastSampleTimeRef.current = frameTime;
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

    return () => window.cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const visibleEnd = now;
  const visibleStart = visibleEnd - LIVE_WINDOW_MS;
  const usablePoints = renderedPoints.filter(
    (point) =>
      point.timestamp >= visibleStart - AXIS_TICK_MS &&
      point.timestamp <= visibleEnd
  );

  if (usablePoints.length < 2) {
    return (
      <div className="flex h-[7.5rem] items-center justify-center border border-dashed border-border-subtle bg-surface/70 px-4 text-sm text-fg-muted">
        {copy.liveChartEmpty}
      </div>
    );
  }

  const axisSourcePoints = renderedPoints.length > 0 ? renderedPoints : usablePoints;
  const prices = axisSourcePoints.length > 0
    ? axisSourcePoints.map((point) => point.price)
    : [0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const latestPoint = usablePoints[usablePoints.length - 1];
  const rawDelta = maxPrice - minPrice;
  const paddedDelta = Math.max(rawDelta * 0.22, maxPrice * 0.00035, 8);
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

  const pathSourcePoints = renderedPoints.filter(
    (point) =>
      point.timestamp >= visibleStart - AXIS_TICK_MS &&
      point.timestamp <= visibleEnd + AXIS_TICK_MS
  );
  const chartPoints = pathSourcePoints.map((point) => ({
    x: getX(point.timestamp),
    y: getY(point.price),
  }));
  const interpolatedChartPoints = interpolateCurvePoints(chartPoints);
  const linePath = buildSmoothPath(interpolatedChartPoints);
  const firstX = interpolatedChartPoints[0]?.x ?? paddingLeft;
  const lastX = interpolatedChartPoints[interpolatedChartPoints.length - 1]?.x ?? (width - paddingRight);
  const lastY = getY(latestPoint.price);
  const baseY = height - paddingBottom;
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;
  return (
    <div className="overflow-hidden border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(242,143,45,0.08),_transparent_42%),linear-gradient(180deg,rgba(24,20,18,0.96),rgba(15,13,12,0.98))] p-4 sm:p-5">
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
          <clipPath id="live-chart-clip">
            <rect
              x={paddingLeft}
              y={paddingTop}
              width={chartWidth + LIVE_DOT_RADIUS + 4}
              height={chartHeight}
            />
          </clipPath>
          <linearGradient id="live-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.areaStart} />
            <stop offset="100%" stopColor={theme.areaEnd} />
          </linearGradient>
          <linearGradient id="live-line-stroke" x1="0" y1="0" x2="1" y2="0">
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
              stroke="rgb(255 245 232 / 0.07)"
              strokeWidth="1"
            />
            <text
              x={width - paddingRight + 18}
              y={tick.y + 4}
              fill="#938b81"
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
            fill="#766f66"
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
        <g clipPath="url(#live-chart-clip)">
          <path d={areaPath} fill="url(#live-area-fill)" />
          <path d={linePath} fill="none" stroke="rgba(11,17,13,0.45)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath} fill="none" stroke="url(#live-line-stroke)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={chartPoints[chartPoints.length - 1].x} cy={lastY} r={LIVE_DOT_RADIUS} fill="#0d1210" stroke={theme.dotStroke} strokeWidth="3" />
          <circle cx={chartPoints[chartPoints.length - 1].x} cy={lastY} r="3.5" fill={theme.dot} />
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-3 text-sm text-fg-muted">
        <span>{copy.liveCoverageStart}: {formatTimeLabel(visibleStart, locale)}</span>
        <span>{copy.liveCoverageEnd}: {formatTimeLabel(visibleEnd, locale)}</span>
      </div>
    </div>
  );
}
