import type { PagesFunction } from '@cloudflare/workers-types'
import { fetchBitcoin, resources, type Resource } from '../../lib/mempool'
import { UpstreamError } from '../../lib/upstream'
import { jsonResponse, methodNotAllowed } from '../../lib/response'

// Same-origin Pages routes remain inside the existing Cloudflare Access boundary.
// No CORS, forwarded credentials, configurable upstream or shared response cache.
export const onRequest: PagesFunction = async ({ request, params }) => {
  const resource = params.resource as Resource
  if (!resources.includes(resource)) return jsonResponse({ error: 'API endpoint not found' }, 404)
  if (request.method !== 'GET') return methodNotAllowed()
  try {
    return jsonResponse(await fetchBitcoin(resource))
  } catch (error) {
    const failure = error instanceof UpstreamError ? error : undefined
    const timeout = failure?.category === 'timeout'
    const rateLimited = resource === 'difficulty-adjustment' && failure?.category === 'rate_limit'
    console.error({
      event: 'bitcoin_upstream_failure',
      resource,
      category: failure?.category ?? 'internal',
      ...(failure?.providerStatus !== undefined ? { providerStatus: failure.providerStatus } : {}),
    })
    return jsonResponse(
      {
        error: rateLimited
          ? 'UPSTREAM_RATE_LIMIT'
          : timeout
            ? 'UPSTREAM_TIMEOUT'
            : 'UPSTREAM_UNAVAILABLE',
      },
      rateLimited ? 429 : timeout ? 504 : 502,
      rateLimited ? { 'Retry-After': '600' } : {},
    )
  }
}
