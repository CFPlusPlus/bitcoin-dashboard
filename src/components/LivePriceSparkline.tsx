"use client";

import {
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
  type TooltipItem,
} from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { useI18n } from "../i18n/context";
import { formatCurrency } from "../lib/format";
import type { Currency } from "../types/dashboard";

ChartJS.register(Filler, LinearScale, LineElement, PointElement, Tooltip);

export type LivePricePoint = {
  price: number;
  timestamp: number;
};

type LivePriceSparklineProps = {
  currency: Currency;
  performancePercent: number | null;
  points: LivePricePoint[];
};

type LiveChartTheme = {
  areaStart: string;
  bgApp: string;
  fontNumeric: string;
  fontSans: string;
  guide: string;
  grid: string;
  line: string;
  pointFill: string;
  pointStroke: string;
  textMuted: string;
  textPrimary: string;
  tooltipBackground: string;
  tooltipBorder: string;
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

function getAbsoluteFrameTimestamp(frameTime: number) {
  if (typeof performance !== "undefined" && Number.isFinite(performance.timeOrigin)) {
    return performance.timeOrigin + frameTime;
  }

  return Date.now();
}

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

function parseHexColor(value: string) {
  const normalized = value.trim().replace("#", "");

  if (normalized.length === 3) {
    return [
      Number.parseInt(normalized[0] + normalized[0], 16),
      Number.parseInt(normalized[1] + normalized[1], 16),
      Number.parseInt(normalized[2] + normalized[2], 16),
    ] as const;
  }

  if (normalized.length === 6) {
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ] as const;
  }

  return null;
}

function parseRgbColor(value: string) {
  const match = value
    .trim()
    .match(/rgba?\(\s*([0-9.]+)(?:\s+|,\s*)([0-9.]+)(?:\s+|,\s*)([0-9.]+)/i);

  if (!match) return null;

  return [
    Number.parseFloat(match[1]),
    Number.parseFloat(match[2]),
    Number.parseFloat(match[3]),
  ] as const;
}

function toRgba(value: string, alpha: number) {
  const rgb = value.trim().startsWith("#") ? parseHexColor(value) : parseRgbColor(value);

  if (!rgb) {
    return value;
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(alpha, 1))})`;
}

function readThemeVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function buildLiveChartTheme(performancePercent: number | null): LiveChartTheme {
  const vars = {
    accentPrimary: readThemeVar("--token-color-accent-primary", "#f7931a"),
    accentStrong: readThemeVar("--token-color-accent-strong", "#ffb14d"),
    bgApp: readThemeVar("--token-color-bg-app", "#080b0f"),
    danger: readThemeVar("--token-color-danger", "#d06b63"),
    fontNumeric: readThemeVar(
      "--token-font-family-numeric",
      '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace'
    ),
    fontSans: readThemeVar(
      "--token-font-family-sans",
      '"Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif'
    ),
    info: readThemeVar("--token-color-info", "#b9794a"),
    success: readThemeVar("--token-color-success", "#58b98b"),
    textMuted: readThemeVar("--token-color-text-muted", "#737e8a"),
    textPrimary: readThemeVar("--token-color-text-primary", "#edf2f7"),
    warning: readThemeVar("--token-color-warning", "#d58a2f"),
  };

  if (typeof performancePercent === "number" && performancePercent < 0) {
    return {
      areaStart: toRgba(vars.danger, 0.42),
      bgApp: vars.bgApp,
      fontNumeric: vars.fontNumeric,
      fontSans: vars.fontSans,
      guide: toRgba(vars.warning, 0.72),
      grid: toRgba(vars.textPrimary, 0.08),
      line: vars.danger,
      pointFill: vars.danger,
      pointStroke: vars.danger,
      textMuted: vars.textMuted,
      textPrimary: vars.textPrimary,
      tooltipBackground: vars.bgApp,
      tooltipBorder: toRgba(vars.danger, 0.42),
    };
  }

  if (typeof performancePercent === "number" && performancePercent > 0) {
    return {
      areaStart: toRgba(vars.success, 0.48),
      bgApp: vars.bgApp,
      fontNumeric: vars.fontNumeric,
      fontSans: vars.fontSans,
      guide: toRgba(vars.warning, 0.72),
      grid: toRgba(vars.textPrimary, 0.08),
      line: vars.success,
      pointFill: vars.success,
      pointStroke: vars.success,
      textMuted: vars.textMuted,
      textPrimary: vars.textPrimary,
      tooltipBackground: vars.bgApp,
      tooltipBorder: toRgba(vars.success, 0.42),
    };
  }

  return {
    areaStart: toRgba(vars.accentPrimary, 0.3),
    bgApp: vars.bgApp,
    fontNumeric: vars.fontNumeric,
    fontSans: vars.fontSans,
    guide: toRgba(vars.warning, 0.72),
    grid: toRgba(vars.textPrimary, 0.08),
    line: vars.accentPrimary,
    pointFill: vars.accentStrong,
    pointStroke: vars.accentPrimary,
    textMuted: vars.textMuted,
    textPrimary: vars.textPrimary,
    tooltipBackground: vars.bgApp,
    tooltipBorder: toRgba(vars.accentPrimary, 0.3),
  };
}

function useLiveChartTheme(performancePercent: number | null) {
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleThemeChange = () => {
      setThemeVersion((current) => current + 1);
    };

    const rootObserver = new MutationObserver(handleThemeChange);
    rootObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-theme", "style"],
      attributes: true,
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      rootObserver.disconnect();
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return useMemo(() => {
    void themeVersion;
    return buildLiveChartTheme(performancePercent);
  }, [performancePercent, themeVersion]);
}

function buildMovingTimeTicks(now: number) {
  const visibleStart = now - LIVE_WINDOW_MS;
  const firstTick = Math.floor(visibleStart / AXIS_TICK_MS) * AXIS_TICK_MS;
  const ticks: Array<{ timestamp: number; positionPercent: number }> = [];

  for (let timestamp = firstTick; timestamp <= now + AXIS_TICK_MS; timestamp += AXIS_TICK_MS) {
    if (timestamp < visibleStart || timestamp > now) {
      continue;
    }

    ticks.push({
      positionPercent: ((timestamp - visibleStart) / LIVE_WINDOW_MS) * 100,
      timestamp,
    });
  }

  return ticks;
}

function createLatestGuidePlugin(color: string): Plugin<"line"> {
  return {
    afterDatasetsDraw(chart) {
      const datasetMeta = chart.getDatasetMeta(0);
      const lastPoint = datasetMeta.data[datasetMeta.data.length - 1];

      if (!lastPoint) {
        return;
      }

      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 10]);
      ctx.moveTo(chart.chartArea.left, lastPoint.y);
      ctx.lineTo(chart.chartArea.right, lastPoint.y);
      ctx.stroke();
      ctx.restore();
    },
    id: "latest-guide-line",
  };
}

function createHoverGuidePlugin(color: string): Plugin<"line"> {
  return {
    afterDatasetsDraw(chart) {
      const activeElements = chart.tooltip?.getActiveElements() ?? [];
      const activeElement = activeElements[0];

      if (!activeElement) {
        return;
      }

      const point = chart.getDatasetMeta(activeElement.datasetIndex).data[activeElement.index];

      if (!point) {
        return;
      }

      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 7]);
      ctx.moveTo(point.x, chart.chartArea.top);
      ctx.lineTo(point.x, chart.chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    },
    id: "hover-guide-line",
  };
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
  const lastFrameTimeRef = useRef<number | null>(null);
  const targetPriceRef = useRef<number | null>(null);
  const currentRenderedPriceRef = useRef<number | null>(null);
  const renderedVelocityRef = useRef(0);
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
      const absoluteFrameTime = getAbsoluteFrameTimestamp(frameTime);
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
        const seedStart = absoluteFrameTime - SAMPLE_INTERVAL_MS * 2;

        lastSampleTimeRef.current = frameTime;
        lastFrameTimeRef.current = frameTime;
        renderedVelocityRef.current = 0;
        setNow(absoluteFrameTime);
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
        const sampleTimestamp = absoluteFrameTime;
        const samplePrice = currentRenderedPriceRef.current;

        lastSampleTimeRef.current = frameTime;
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
  const axisSourcePoints = displayPoints.length > 0 ? displayPoints : usablePoints;
  const prices = axisSourcePoints.length > 0 ? axisSourcePoints.map((point) => point.price) : [0];
  const firstVisiblePoint = usablePoints[0] ??
    axisSourcePoints[0] ?? { price: 0, timestamp: visibleStart };
  const latestPoint = usablePoints[usablePoints.length - 1] ??
    axisSourcePoints[axisSourcePoints.length - 1] ?? {
      price: 0,
      timestamp: visibleEnd,
    };
  const visiblePerformancePercent =
    firstVisiblePoint.price === 0
      ? (performancePercent ?? 0)
      : ((latestPoint.price - firstVisiblePoint.price) / firstVisiblePoint.price) * 100;
  const theme = useLiveChartTheme(visiblePerformancePercent);
  const rawDelta = Math.max(...prices) - Math.min(...prices);
  const paddedDelta = Math.max(
    rawDelta * Y_AXIS_PADDING_RATIO,
    Math.max(...prices) * Y_AXIS_MIN_PADDING_RATIO,
    Y_AXIS_MIN_PADDING_ABSOLUTE
  );
  const axisMin = Math.min(...prices) - paddedDelta;
  const axisMax = Math.max(...prices) + paddedDelta;
  const chartPoints = displayPoints
    .filter(
      (point) =>
        point.timestamp >= visibleStart - AXIS_TICK_MS &&
        point.timestamp <= visibleEnd + AXIS_TICK_MS
    )
    .map((point) => ({
      x: point.timestamp,
      y: point.price,
    }));
  const movingTicks = buildMovingTimeTicks(visibleEnd);

  const data = useMemo<ChartData<"line", Array<{ x: number; y: number }>>>(
    () => ({
      datasets: [
        {
          backgroundColor: theme.areaStart,
          borderColor: theme.line,
          borderJoinStyle: "round",
          borderWidth: 3.2,
          clip: 10,
          cubicInterpolationMode: "monotone",
          data: chartPoints,
          fill: "origin",
          parsing: false,
          pointBackgroundColor: theme.bgApp,
          pointBorderColor: theme.pointStroke,
          pointBorderWidth: (context) => (context.dataIndex === chartPoints.length - 1 ? 3 : 0),
          pointHitRadius: 18,
          pointHoverBackgroundColor: theme.bgApp,
          pointHoverBorderColor: theme.pointStroke,
          pointHoverBorderWidth: 2.4,
          pointHoverRadius: 8,
          pointRadius: (context) =>
            context.dataIndex === chartPoints.length - 1 ? LIVE_DOT_RADIUS : 0,
          pointStyle: "circle",
          spanGaps: true,
          tension: 0.16,
        },
      ],
    }),
    [chartPoints, theme.areaStart, theme.bgApp, theme.line, theme.pointStroke]
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      animation: false,
      maintainAspectRatio: false,
      normalized: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: theme.tooltipBackground,
          bodyColor: theme.textPrimary,
          bodyFont: {
            family: theme.fontNumeric,
            size: 13,
            weight: 600,
          },
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<"line">) =>
              formatCurrency(context.parsed.y ?? 0, currency, locale),
            title: (items: TooltipItem<"line">[]) =>
              formatHoverDateLabel(items[0]?.parsed.x ?? visibleEnd, locale),
          },
          caretPadding: 12,
          displayColors: false,
          intersect: false,
          mode: "nearest",
          padding: 10,
          titleColor: theme.textMuted,
          titleFont: {
            family: theme.fontSans,
            size: 11.5,
            weight: 500,
          },
        },
      },
      responsive: true,
      scales: {
        x: {
          border: {
            display: false,
          },
          bounds: "data",
          display: false,
          max: visibleEnd,
          min: visibleStart,
          type: "linear",
        },
        y: {
          border: {
            display: false,
          },
          grid: {
            color: theme.grid,
            drawTicks: false,
          },
          max: axisMax,
          min: axisMin,
          position: "right",
          ticks: {
            autoSkip: false,
            color: theme.textMuted,
            count: 4,
            font: {
              family: theme.fontSans,
              size: 15,
              weight: 500,
            },
            padding: 18,
            callback: (value) =>
              formatCurrency(typeof value === "number" ? value : Number(value), currency, locale),
          },
          type: "linear",
        },
      },
      interaction: {
        axis: "x",
        intersect: false,
        mode: "nearest",
      },
    }),
    [
      axisMax,
      axisMin,
      currency,
      locale,
      theme.fontNumeric,
      theme.fontSans,
      theme.grid,
      theme.textMuted,
      theme.textPrimary,
      theme.tooltipBackground,
      theme.tooltipBorder,
      visibleEnd,
      visibleStart,
    ]
  );

  const plugins = useMemo(
    () => [createLatestGuidePlugin(theme.guide), createHoverGuidePlugin(toRgba(theme.grid, 0.95))],
    [theme.grid, theme.guide]
  );

  if (usablePoints.length < 2) {
    return (
      <div className="flex h-[7.5rem] items-center justify-center rounded-md border border-dashed border-border-default bg-surface px-4 text-sm text-fg-muted">
        {copy.liveChartEmpty}
      </div>
    );
  }

  return (
    <div
      className="relative isolate overflow-hidden rounded-md border p-4 sm:p-5"
      style={{
        borderColor: "color-mix(in srgb, var(--token-color-border-default) 75%, transparent)",
        background: "var(--token-color-bg-elevated)",
      }}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
          <span>{copy.liveChartLabel}</span>
        </div>

        <div className="h-[15.5rem] sm:h-[17.5rem]">
          <Line
            aria-label={copy.liveChartAriaLabel}
            className="h-full w-full"
            data={data}
            options={options}
            plugins={plugins}
            role="img"
          />
        </div>

        <div className="mt-2 flex h-5">
          <div
            className="relative h-full flex-1 overflow-hidden"
            style={{ marginRight: "-0.9rem" }}
          >
            {movingTicks.map((tick) => (
              <span
                key={tick.timestamp}
                className="absolute top-0 whitespace-nowrap -translate-x-1/2 text-sm text-fg-muted"
                style={{ left: `${tick.positionPercent}%` }}
              >
                {formatTimeLabel(tick.timestamp, locale)}
              </span>
            ))}
          </div>
          <div aria-hidden="true" className="w-[6.75rem] shrink-0" />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-default pt-3 text-sm text-fg-muted">
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
