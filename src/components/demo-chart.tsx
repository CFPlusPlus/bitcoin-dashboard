import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ChartCanvas, { type ChartToken } from '@/components/chart-canvas'
import { getDemoSeries } from '@/lib/demo'

export default function DemoChart() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['demo', 'indexed-series'],
    queryFn: getDemoSeries,
  })
  const option = useMemo(
    () => (token: ChartToken) => {
      if (!data) return {}
      return {
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
      }
    },
    [data],
  )
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
    <ChartCanvas
      option={option}
      label="Demo-Chart: synthetischer Indexverlauf, keine Live- oder historischen Bitcoin-Daten"
    />
  )
}
