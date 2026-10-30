import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { init, use as registerECharts } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDemoSeries } from '@/lib/demo'
import { useTheme } from '@/lib/theme'

registerECharts([LineChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])

export default function DemoChart() {
  const container = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const { data, isPending, isError } = useQuery({
    queryKey: ['demo', 'indexed-series'],
    queryFn: getDemoSeries,
  })
  useEffect(() => {
    if (!container.current || !data) return
    const chart = init(container.current)
    const dark = theme === 'dark'
    chart.setOption({
      animation: false,
      aria: {
        enabled: true,
        description: 'Synthetischer Demo-Verlauf mit Indexwerten. Keine Bitcoin-Kursdaten.',
      },
      grid: { top: 20, left: 44, right: 20, bottom: 32 },
      tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${value} (Demo-Index)` },
      xAxis: {
        type: 'category',
        data: data.values.map((_, i) => `P${i + 1}`),
        boundaryGap: false,
        axisLine: { lineStyle: { color: dark ? '#252D37' : '#E2E7ED' } },
        axisLabel: { color: dark ? '#98A5B5' : '#526174' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 90,
        max: 130,
        splitLine: { lineStyle: { color: dark ? '#252D37' : '#E2E7ED' } },
        axisLabel: { color: dark ? '#98A5B5' : '#526174' },
      },
      series: [
        {
          type: 'line',
          data: data.values,
          showSymbol: false,
          lineStyle: { color: dark ? '#F7931A' : '#D97706', width: 2 },
          areaStyle: { color: dark ? '#F7931A' : '#D97706', opacity: 0.06 },
        },
      ],
    })
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [data, theme])
  if (isPending)
    return (
      <div className="chart-placeholder" role="status">
        Demo-Chart wird geladen …
      </div>
    )
  if (isError)
    return (
      <div className="chart-placeholder" role="alert">
        Demo-Chart konnte nicht geladen werden.
      </div>
    )
  return (
    <div
      ref={container}
      className="h-72 w-full md:h-80"
      role="img"
      aria-label="Demo-Chart: synthetischer Indexverlauf, keine Live- oder historischen Bitcoin-Daten"
    />
  )
}
