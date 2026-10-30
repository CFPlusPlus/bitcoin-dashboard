import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { bitcoinOptions } from '@/lib/bitcoin'
import { envelope } from './bitcoin-fixtures'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Bitcoin automatic retries', () => {
  it('retries a browser timeout during body reading only once', async () => {
    let active: AbortController
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      active = new AbortController()
      return active.signal
    })
    const fetcher = vi.fn().mockImplementation(
      async () =>
        new Response(
          new ReadableStream({
            pull(controller) {
              active.abort(new DOMException('private timeout reason', 'TimeoutError'))
              controller.error(active.signal.reason)
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetcher)
    const client = new QueryClient()
    try {
      await expect(
        client.fetchQuery({ ...bitcoinOptions('height'), retryDelay: 0 }),
      ).rejects.toThrow('Verbindung fehlgeschlagen')
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      client.clear()
    }
  })
  it.each([400, 401, 403, 404, 405, 429, 500, 502, 503, 504, 'network', 'html', 'json', 'data'])(
    'limits attempts for %s and preserves previously validated data',
    async (failure) => {
      const saved = envelope({ height: 900000 })
      const fetcher = vi.fn().mockImplementation(() => {
        if (failure === 'network') return Promise.reject(new TypeError('offline'))
        if (typeof failure === 'number')
          return Promise.resolve(new Response('', { status: failure }))
        if (failure === 'html') return Promise.resolve(new Response('<html>'))
        if (failure === 'json')
          return Promise.resolve(
            new Response('{', { headers: { 'Content-Type': 'application/json' } }),
          )
        return Promise.resolve(Response.json(envelope({ height: -1 })))
      })
      vi.stubGlobal('fetch', fetcher)
      const client = new QueryClient()
      client.setQueryData(['bitcoin', 'height'], saved)
      try {
        await expect(
          client.fetchQuery({ ...bitcoinOptions('height'), staleTime: 0, retryDelay: 0 }),
        ).rejects.toThrow()
        expect(fetcher).toHaveBeenCalledTimes(
          failure === 'network' || (typeof failure === 'number' && failure >= 500) ? 2 : 1,
        )
        expect(client.getQueryData(['bitcoin', 'height'])).toEqual(saved)
      } finally {
        client.clear()
      }
    },
  )
  it('retains the 15s browser timeout and query cancellation signal', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        signal = init.signal as AbortSignal
        return new Promise((_resolve, reject) =>
          signal!.addEventListener('abort', () => reject(signal!.reason)),
        )
      }),
    )
    const client = new QueryClient()
    try {
      const pending = client.fetchQuery(bitcoinOptions('height'))
      expect(timeout).toHaveBeenCalledWith(15_000)
      await client.cancelQueries({ queryKey: ['bitcoin', 'height'] })
      await expect(pending).rejects.toThrow()
      expect(signal?.aborted).toBe(true)
    } finally {
      client.clear()
    }
  })
})
