import { useMemo } from 'react'
import ChartCanvas, { type ChartToken } from '@/components/chart-canvas'
import type { MarketHistoryResponse } from '../../../shared/market'

export default function HistoryChart({ history }: { history: MarketHistoryResponse }) {
  const { currency, days, points } = history.data
  const option = useMemo(
    () => (token: ChartToken) => {
      const money = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 2,
      })
      const axisMoney = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency.toUpperCase(),
        notation: 'compact',
        maximumFractionDigits: 1,
      })
      const date = new Intl.DateTimeFormat(
        'de-DE',
        days === 1
          ? { hour: '2-digit', minute: '2-digit' }
          : days === 365
            ? { month: 'short', year: '2-digit' }
            : { day: '2-digit', month: '2-digit' },
      )
      const fullDate = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(days <= 7 ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
      })
      return {
        animation: false,
        textStyle: { fontFamily: token('font-interface'), color: token('foreground') },
        aria: {
          enabled: true,
          description: `Bitcoin-Kursverlauf in ${currency.toUpperCase()} · ${days} ${days === 1 ? 'Tag' : 'Tage'}. ${points.length} Messpunkte von CoinGecko. Beginn: ${money.format(points[0].price)}. Ende: ${money.format(points.at(-1)!.price)}.`,
        },
        grid: { top: 20, left: 8, right: 16, bottom: 8, containLabel: true },
        tooltip: {
          trigger: 'axis',
          renderMode: 'richText',
          confine: true,
          triggerOn: 'mousemove|click',
          backgroundColor: token('surface'),
          borderColor: token('control-border'),
          textStyle: {
            color: token('foreground'),
            fontFamily: token('font-technical'),
            fontSize: 12,
          },
          // Rich text avoids inserting any API data as HTML.
          formatter: (params: unknown) => {
            if (!Array.isArray(params)) return ''
            const point = params[0] as { value?: unknown } | undefined
            if (!Array.isArray(point?.value)) return ''
            const [timestamp, price] = point.value as [number, number]
            return `${fullDate.format(timestamp)}\nBTC: ${money.format(price)}`
          },
        },
        xAxis: {
          type: 'time',
          min: points[0].timestamp,
          max: points.at(-1)!.timestamp,
          axisLine: { lineStyle: { color: token('border') } },
          axisTick: { show: false },
          axisLabel: {
            color: token('foreground-secondary'),
            fontFamily: token('font-technical'),
            fontSize: 11,
            hideOverlap: true,
            formatter: (value: number) => date.format(value),
          },
          splitNumber: 4,
        },
        yAxis: {
          type: 'value',
          scale: true,
          splitNumber: 4,
          splitLine: { lineStyle: { color: token('border') } },
          axisLabel: {
            color: token('foreground-secondary'),
            fontFamily: token('font-technical'),
            fontSize: 11,
            formatter: (value: number) => axisMoney.format(value),
          },
        },
        series: [
          {
            name: 'BTC',
            type: 'line',
            showSymbol: false,
            smooth: false,
            data: points.map(({ timestamp, price }) => [timestamp, price]),
            lineStyle: { color: token('accent'), width: 2 },
            areaStyle: { color: token('accent'), opacity: 0.06 },
          },
        ],
      }
    },
    [currency, days, points],
  )
  return (
    <ChartCanvas
      option={option}
      label={`Bitcoin-Kursverlauf in ${currency.toUpperCase()} · ${days} ${days === 1 ? 'Tag' : 'Tage'}`}
    />
  )
}
