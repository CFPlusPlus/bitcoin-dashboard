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
import { useChartPalette, type ChartTone } from "./useChartPalette";

ChartJS.register(Filler, LinearScale, LineElement, PointElement, Tooltip);

export type LineChartPoint = {
  x: number;
  y: number;
};

type BaseLineChartProps = {
  ariaLabel: string;
  className?: string;
  compact?: boolean;
  height?: number;
  points: LineChartPoint[];
  showArea?: boolean;
  showVerticalHoverGuide?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  tone?: ChartTone;
  tooltipTitleFormatter?: (value: number) => string;
  tooltipValueFormatter?: (value: number) => string;
  xTickFormatter?: (value: number) => string;
  yTickFormatter?: (value: number) => string;
};

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
    id: "vertical-hover-guide",
  };
}

export default function BaseLineChart({
  ariaLabel,
  className,
  compact = false,
  height = compact ? 84 : 340,
  points,
  showArea = true,
  showVerticalHoverGuide = true,
  showXAxis = true,
  showYAxis = true,
  tone = "default",
  tooltipTitleFormatter,
  tooltipValueFormatter,
  xTickFormatter,
  yTickFormatter,
}: BaseLineChartProps) {
  const palette = useChartPalette(tone);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const xValues = points.map((point) => point.x);
  const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
  const xMax = xValues.length > 0 ? Math.max(...xValues) : 0;
  const xTickLimit = compact
    ? 0
    : containerWidth >= 1280
      ? 8
      : containerWidth >= 1040
        ? 7
        : containerWidth >= 880
          ? 6
          : containerWidth >= 720
            ? 5
            : containerWidth >= 560
              ? 4
              : 3;

  useEffect(() => {
    const element = wrapperRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const data = useMemo<ChartData<"line", LineChartPoint[]>>(
    () => ({
      datasets: [
        {
          backgroundColor: showArea ? palette.areaStart : "transparent",
          borderColor: palette.line,
          borderJoinStyle: "round",
          borderWidth: compact ? 1.35 : 1.7,
          clip: 8,
          cubicInterpolationMode: "monotone",
          data: points,
          fill: showArea ? "origin" : false,
          parsing: false,
          pointBackgroundColor: palette.pointFill,
          pointBorderColor: palette.lineStrong,
          pointBorderWidth: (context) =>
            context.dataIndex === points.length - 1 ? (compact ? 1.2 : 1.4) : 0,
          pointHitRadius: compact ? 14 : 18,
          pointHoverBackgroundColor: palette.pointFill,
          pointHoverBorderColor: palette.lineStrong,
          pointHoverBorderWidth: compact ? 1.5 : 1.8,
          pointHoverRadius: compact ? 4.25 : 5.5,
          pointRadius: (context) =>
            context.dataIndex === points.length - 1 ? (compact ? 2.4 : 3) : 0,
          spanGaps: true,
          tension: compact ? 0.24 : 0.18,
        },
      ],
    }),
    [
      compact,
      palette.areaStart,
      palette.line,
      palette.lineStrong,
      palette.pointFill,
      points,
      showArea,
    ]
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
          backgroundColor: palette.tooltipBackground,
          bodyColor: palette.lineStrong,
          bodyFont: {
            family: palette.fontNumeric,
            size: compact ? 11 : 12,
            weight: 600,
          },
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          boxPadding: 0,
          callbacks: {
            label: (context: TooltipItem<"line">) =>
              tooltipValueFormatter
                ? tooltipValueFormatter(context.parsed.y ?? 0)
                : `${context.parsed.y ?? 0}`,
            title: (items: TooltipItem<"line">[]) => {
              const xValue = items[0]?.parsed.x ?? 0;
              return tooltipTitleFormatter ? tooltipTitleFormatter(xValue) : `${xValue}`;
            },
          },
          caretPadding: 10,
          displayColors: false,
          footerFont: {
            family: palette.fontSans,
          },
          intersect: false,
          mode: "index",
          padding: 10,
          titleColor: palette.textMuted,
          titleFont: {
            family: palette.fontSans,
            size: compact ? 10 : 11,
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
          display: showXAxis,
          grid: {
            display: false,
            drawTicks: false,
          },
          max: xMax,
          min: xMin,
          ticks: {
            autoSkip: true,
            autoSkipPadding: compact ? 14 : 20,
            color: palette.textMuted,
            font: {
              family: palette.fontSans,
              size: compact ? 11 : 13,
              weight: 500,
            },
            maxRotation: 0,
            maxTicksLimit: compact ? undefined : xTickLimit,
            padding: compact ? 6 : 10,
            callback: (value) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              return xTickFormatter ? xTickFormatter(numericValue) : `${numericValue}`;
            },
          },
          type: "linear",
        },
        y: {
          border: {
            display: false,
          },
          display: showYAxis,
          grace: compact ? "10%" : "6%",
          grid: {
            color: palette.grid,
            drawTicks: false,
          },
          ticks: {
            autoSkip: true,
            color: palette.textMuted,
            font: {
              family: palette.fontNumeric,
              size: compact ? 11 : 12,
              weight: 500,
            },
            maxTicksLimit: compact ? 4 : 3,
            padding: showYAxis ? 10 : 0,
            callback: (value) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              return yTickFormatter ? yTickFormatter(numericValue) : `${numericValue}`;
            },
          },
        },
      },
      interaction: {
        axis: "x",
        intersect: false,
        mode: "index",
      },
    }),
    [
      compact,
      palette.fontNumeric,
      palette.fontSans,
      palette.grid,
      palette.lineStrong,
      palette.textMuted,
      palette.tooltipBackground,
      palette.tooltipBorder,
      showXAxis,
      showYAxis,
      tooltipTitleFormatter,
      tooltipValueFormatter,
      xMax,
      xMin,
      xTickLimit,
      xTickFormatter,
      yTickFormatter,
    ]
  );

  const plugins = useMemo(
    () => (showVerticalHoverGuide ? [createHoverGuidePlugin(palette.guide)] : []),
    [palette.guide, showVerticalHoverGuide]
  );

  return (
    <div className={className} ref={wrapperRef} style={{ height }}>
      <Line
        aria-label={ariaLabel}
        className="h-full w-full"
        data={data}
        options={options}
        plugins={plugins}
        role="img"
      />
    </div>
  );
}
