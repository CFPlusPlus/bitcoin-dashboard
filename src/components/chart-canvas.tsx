import { useEffect, useRef, useState } from 'react'
import {
  getInstanceByDom,
  init,
  use as registerECharts,
  type EChartsCoreOption,
} from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTheme } from '@/lib/theme'

registerECharts([LineChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])
export type ChartToken = (name: string) => string

export default function ChartCanvas({
  label,
  option,
}: {
  label: string
  option: (token: ChartToken) => EChartsCoreOption
}) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<ReturnType<typeof init> | null>(null)
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const { theme } = useTheme()
  useEffect(() => {
    const element = container.current!
    let observer: ResizeObserver | undefined
    let stopped = false
    const cleanup = () => {
      if (stopped) return
      stopped = true
      try {
        observer?.disconnect()
      } finally {
        const instance = chart.current ?? getInstanceByDom(element)
        chart.current = null
        instance?.dispose()
      }
    }
    try {
      const instance = init(element)
      chart.current = instance
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
          setFailure({ error: cause })
        }
      })
      observer.observe(element)
    } catch (error) {
      cleanup()
      throw error
    }
    return cleanup
  }, [])
  useEffect(() => {
    if (!chart.current || !container.current) return
    const styles = getComputedStyle(container.current)
    chart.current.setOption(
      option((name) => styles.getPropertyValue(`--${name}`).trim()),
      { notMerge: true },
    )
  }, [option, theme])
  if (failure) throw failure.error
  return (
    <div
      ref={container}
      className="market-chart-canvas h-72 w-full md:h-80"
      role="img"
      aria-label={label}
    />
  )
}
