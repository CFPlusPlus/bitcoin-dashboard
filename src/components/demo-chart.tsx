import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInstanceByDom, init, use as registerECharts } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDemoSeries } from '@/lib/demo'
import { useTheme } from '@/lib/theme'

registerECharts([LineChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])

export default function DemoChart() {
  const container = useRef<HTMLDivElement>(null)
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const { theme } = useTheme()
  const { data, isPending, isError } = useQuery({
    queryKey: ['demo', 'indexed-series'],
    queryFn: getDemoSeries,
  })
  useEffect(() => {
    if (!container.current || !data) return
    const element = container.current
    let chart: ReturnType<typeof init> | undefined
    let observer: ResizeObserver | undefined
    let stopped = false
    const cleanup = () => {
      if (stopped) return
      stopped = true
      try {
        observer?.disconnect()
      } finally {
        // init can throw after registering an instance (e.g. in an afterinit hook).
        const instance = chart ?? getInstanceByDom(element)
        instance?.dispose()
      }
    }
    try {
      const instance = init(element)
      chart = instance
      const styles = getComputedStyle(element)
      const token = (name: string) => styles.getPropertyValue(`--${name}`).trim()
      instance.setOption({
        animation: false,
        textStyle: { fontFamily: token('font-interface'), color: token('foreground') },
        aria: {
          enabled: true,
          description: 'Synthetischer Demo-Verlauf mit Indexwerten. Keine Bitcoin-Kursdaten.',
        },
        grid: { top: 20, left: 44, right: 20, bottom: 32 },
        tooltip: {
          trigger: 'axis',
          valueFormatter: (value: number) => `${value} (Demo-Index)`,
          backgroundColor: token('surface'),
          borderColor: token('control-border'),
          textStyle: {
            color: token('foreground'),
            fontFamily: token('font-technical'),
            fontSize: 12,
          },
          confine: true,
        },
        xAxis: {
          type: 'category',
          data: data.values.map((_, i) => `P${i + 1}`),
          boundaryGap: false,
          axisLine: { lineStyle: { color: token('border') } },
          axisLabel: {
            color: token('foreground-secondary'),
            fontFamily: token('font-technical'),
            fontSize: 12,
          },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          min: 90,
          max: 130,
          splitLine: { lineStyle: { color: token('border') } },
          axisLabel: {
            color: token('foreground-secondary'),
            fontFamily: token('font-technical'),
            fontSize: 12,
          },
        },
        series: [
          {
            type: 'line',
            data: data.values,
            showSymbol: false,
            lineStyle: { color: token('data-primary'), width: 2 },
            areaStyle: { color: token('data-primary'), opacity: 0.06 },
          },
        ],
      })
      observer = new ResizeObserver(() => {
        if (stopped) return
        try {
          instance.resize()
        } catch (error) {
          let cause = error
          try {
            cleanup()
          } catch (cleanupError) {
            cause = cleanupError
          }
          // Throw during the next React render so the local boundary can recover.
          setFailure({ error: cause })
        }
      })
      observer.observe(element)
    } catch (error) {
      cleanup()
      throw error
    }
    return cleanup
  }, [data, theme])
  if (failure) throw failure.error
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
