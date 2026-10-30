import type { PagesFunction } from '@cloudflare/workers-types'
import { jsonResponse, methodNotAllowed } from '../lib/response'

export const onRequest: PagesFunction = ({ request }) =>
  request.method === 'GET'
    ? jsonResponse({ status: 'ok', service: 'bitcoin-dashboard' })
    : methodNotAllowed()
