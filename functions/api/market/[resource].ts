import type { PagesFunction } from '@cloudflare/workers-types'
import { createMarketService } from '../../lib/market-cache'
import { UpstreamError } from '../../lib/upstream'
import { jsonResponse } from '../../lib/response'
import { MARKET_ERROR_STATUS, type MarketErrorCode } from '../../../shared/market'
import { marketCurrency, historyDays } from '../../../shared/market-validation'

type Env = {
  COINGECKO_DEMO_API_KEY?: string
  MARKET_SNAPSHOT_ENABLED?: string
  MARKET_HISTORY_ENABLED?: string
}

function failure(code: MarketErrorCode) {
  return jsonResponse(
    { error: { code, ...(code === 'UPSTREAM_RATE_LIMIT' ? { retryAfterSeconds: 600 } : {}) } },
    MARKET_ERROR_STATUS[code],
    code === 'METHOD_NOT_ALLOWED'
      ? { Allow: 'GET' }
      : code === 'UPSTREAM_RATE_LIMIT'
        ? { 'Retry-After': '600' }
        : {},
  )
}

export function createMarketHandler(): PagesFunction<Env> {
  const service = createMarketService()
  return async ({ request, params, env }) => {
    const resource = params.resource
    if (resource !== 'snapshot' && resource !== 'history') return failure('NOT_FOUND')
    if (request.method !== 'GET') return failure('METHOD_NOT_ALLOWED')
    const url = new URL(request.url)
    let history: { currency: 'eur' | 'usd'; days: ReturnType<typeof historyDays> } | undefined
    if (resource === 'snapshot' && url.search) return failure('INVALID_REQUEST')
    if (resource === 'history') {
      try {
        const pairs = [...url.searchParams]
        if (
          url.search.length > 64 ||
          pairs.length !== 2 ||
          url.searchParams.getAll('currency').length !== 1 ||
          url.searchParams.getAll('days').length !== 1
        )
          throw new Error('Invalid parameters')
        const rawDays = url.searchParams.get('days')
        const days = historyDays(Number(rawDays))
        if (String(days) !== rawDays) throw new Error('Invalid days')
        history = { currency: marketCurrency(url.searchParams.get('currency')), days }
      } catch {
        return failure('INVALID_REQUEST')
      }
    }
    if (!env.COINGECKO_DEMO_API_KEY?.trim()) return failure('MARKET_NOT_CONFIGURED')
    // A secret alone never authorizes provider use. Enable separately only after release evidence.
    if (
      (resource === 'snapshot' ? env.MARKET_SNAPSHOT_ENABLED : env.MARKET_HISTORY_ENABLED) !==
      'true'
    )
      return failure('MARKET_NOT_RELEASED')
    try {
      return jsonResponse(
        history
          ? await service.history(env.COINGECKO_DEMO_API_KEY, history.currency, history.days)
          : await service.snapshot(env.COINGECKO_DEMO_API_KEY),
      )
    } catch (error) {
      const upstream = error instanceof UpstreamError ? error : undefined
      console.error({
        event: 'market_upstream_failure',
        resource,
        category: upstream?.category ?? 'internal',
        ...(upstream?.providerStatus !== undefined
          ? { providerStatus: upstream.providerStatus }
          : {}),
      })
      if (upstream?.category === 'rate_limit') return failure('UPSTREAM_RATE_LIMIT')
      if (upstream?.category === 'timeout') return failure('UPSTREAM_TIMEOUT')
      if (
        upstream?.providerStatus === 401 ||
        upstream?.providerStatus === 403 ||
        (upstream?.category === 'http' &&
          upstream.providerStatus !== undefined &&
          upstream.providerStatus >= 400 &&
          upstream.providerStatus < 500)
      )
        return failure('UPSTREAM_CONFIGURATION')
      if (
        upstream?.category === 'invalid_data' ||
        upstream?.category === 'response_too_large' ||
        (upstream?.category === 'http' &&
          upstream.providerStatus !== undefined &&
          upstream.providerStatus < 400)
      )
        return failure('UPSTREAM_INVALID_RESPONSE')
      return failure('UPSTREAM_UNAVAILABLE')
    }
  }
}

export const onRequest = createMarketHandler()
