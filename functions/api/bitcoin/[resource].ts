import type { PagesFunction } from '@cloudflare/workers-types'
import { fetchBitcoin, resources, type Resource } from '../../lib/mempool'

// Same-origin Pages routes remain inside the existing Cloudflare Access boundary.
// No CORS, forwarded credentials, configurable upstream or shared response cache.
export const onRequest: PagesFunction = async ({ request, params }) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  const resource = params.resource as Resource
  if (!resources.includes(resource))
    return Response.json({ error: 'API endpoint not found' }, { status: 404, headers })
  if (request.method !== 'GET')
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { ...headers, Allow: 'GET' } },
    )
  try {
    return Response.json(await fetchBitcoin(resource), { headers })
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'TimeoutError'
    return Response.json(
      { error: timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE' },
      { status: timeout ? 504 : 502, headers },
    )
  }
}
