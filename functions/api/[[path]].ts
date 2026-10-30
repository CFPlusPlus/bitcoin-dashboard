import type { PagesFunction } from '@cloudflare/workers-types'
import { jsonResponse } from '../lib/response'

export const onRequest: PagesFunction = () => jsonResponse({ error: 'API endpoint not found' }, 404)
