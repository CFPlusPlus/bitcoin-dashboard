import type { PagesFunction } from '@cloudflare/workers-types'

export const onRequestGet: PagesFunction = () =>
  Response.json(
    { status: 'ok', service: 'bitcoin-dashboard' },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  )
