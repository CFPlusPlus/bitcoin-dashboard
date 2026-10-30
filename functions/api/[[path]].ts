import type { PagesFunction } from '@cloudflare/workers-types'

export const onRequest: PagesFunction = () =>
  Response.json({ error: 'API endpoint not found' }, { status: 404 })
