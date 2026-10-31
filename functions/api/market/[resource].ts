import type { PagesFunction } from '@cloudflare/workers-types'
import { fetchMarketSnapshot } from '../../lib/coingecko'
import { UpstreamError } from '../../lib/upstream'
import { jsonResponse } from '../../lib/response'
import { MARKET_ERROR_STATUS, type MarketErrorCode } from '../../../shared/market'

type Env = { COINGECKO_DEMO_API_KEY?: string; MARKET_SNAPSHOT_ENABLED?: string }

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

export const onRequest: PagesFunction<Env> = async ({ request, params, env }) => {
  if (params.resource !== 'snapshot') return failure('NOT_FOUND')
  if (request.method !== 'GET') return failure('METHOD_NOT_ALLOWED')
  if (new URL(request.url).search) return failure('INVALID_REQUEST')
  if (!env.COINGECKO_DEMO_API_KEY?.trim()) return failure('MARKET_NOT_CONFIGURED')
  // A secret alone never authorizes provider use. Enable separately only after release evidence.
  if (env.MARKET_SNAPSHOT_ENABLED !== 'true') return failure('MARKET_NOT_RELEASED')
  try {
    return jsonResponse(await fetchMarketSnapshot(env.COINGECKO_DEMO_API_KEY))
  } catch (error) {
    const upstream = error instanceof UpstreamError ? error : undefined
    console.error({
      event: 'market_upstream_failure',
      resource: 'snapshot',
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
