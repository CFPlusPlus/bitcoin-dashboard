import type { PagesFunction } from '@cloudflare/workers-types'
import { HASHRATE_ERRORS, type HashrateError } from '../../../shared/hashrate'
import { createHashrateService } from '../../lib/hashrate'
import { jsonResponse } from '../../lib/response'
import { UpstreamError } from '../../lib/upstream'

type Env = { MINING_HASHRATE_ENABLED?: string }
export function createHashrateHandler(): PagesFunction<Env> {
  const load = createHashrateService()
  return async ({ request, env }) => {
    const failure = (code: HashrateError) =>
      jsonResponse(
        { error: { code } },
        HASHRATE_ERRORS[code],
        code === 'METHOD_NOT_ALLOWED'
          ? { Allow: 'GET' }
          : code === 'UPSTREAM_RATE_LIMIT'
            ? { 'Retry-After': '600' }
            : {},
      )
    if (request.method !== 'GET') return failure('METHOD_NOT_ALLOWED')
    if (new URL(request.url).search) return failure('INVALID_REQUEST')
    if (env.MINING_HASHRATE_ENABLED !== 'true') return failure('HASHRATE_NOT_RELEASED')
    try {
      return jsonResponse(await load())
    } catch (error) {
      const upstream = error instanceof UpstreamError ? error : undefined
      console.error({
        event: 'hashrate_upstream_failure',
        category: upstream?.category ?? 'internal',
        ...(upstream?.providerStatus !== undefined
          ? { providerStatus: upstream.providerStatus }
          : {}),
      })
      return failure(
        upstream?.category === 'rate_limit'
          ? 'UPSTREAM_RATE_LIMIT'
          : upstream?.category === 'timeout'
            ? 'UPSTREAM_TIMEOUT'
            : upstream?.category === 'invalid_data' ||
                upstream?.category === 'response_too_large' ||
                (upstream?.category === 'http' && (upstream.providerStatus ?? 500) < 400)
              ? 'UPSTREAM_INVALID_RESPONSE'
              : 'UPSTREAM_UNAVAILABLE',
      )
    }
  }
}
export const onRequest = createHashrateHandler()
