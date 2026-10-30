// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBitcoin, parseMempool, responseByteLimits } from '../../functions/lib/mempool'
import { readBoundedText, UpstreamError } from '../../functions/lib/upstream'
import { MAX_HISTOGRAM_ENTRIES } from '../../shared/bitcoin-limits'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { envelope, rawFees, rawMempool } from './bitcoin-fixtures'

afterEach(() => vi.restoreAllMocks())

function streamResponse(chunks: Uint8Array[], headers = {}) {
  const cancel = vi.fn()
  let index = 0
  const response = new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < chunks.length) controller.enqueue(chunks[index++])
        else controller.close()
      },
      cancel,
    }),
    { headers },
  )
  return { response, cancel }
}
const encode = (text: string) => new TextEncoder().encode(text)
const fetchResponse = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response)

describe('bounded upstream responses', () => {
  it('accepts valid JSON exactly at the resource byte limit', async () => {
    const json = JSON.stringify(rawFees)
    const body = json.padEnd(responseByteLimits.fees, ' ')
    expect((await fetchBitcoin('fees', fetchResponse(new Response(body)))).data.fastest).toBe(2)
  })
  it('accepts exactly the byte budget and decodes split UTF-8', async () => {
    const bytes = encode('€')
    const { response } = streamResponse([bytes.slice(0, 1), bytes.slice(1)])
    expect(await readBoundedText(response, 3, new AbortController().signal)).toBe('€')
  })
  it('rejects Content-Length before acquiring a reader and cancels the body', async () => {
    const { response, cancel } = streamResponse([encode('{}')], {
      'Content-Length': String(responseByteLimits.fees + 1),
    })
    const getReader = vi.spyOn(response.body!, 'getReader')
    await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
      category: 'response_too_large',
      providerStatus: 200,
    })
    expect(getReader).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledOnce()
  })
  it.each([undefined, '1', 'invalid'])(
    'counts actual bytes with Content-Length %s',
    async (length) => {
      const { response, cancel } = streamResponse(
        [new Uint8Array(responseByteLimits.fees), encode('x'), encode('unread')],
        length === undefined ? {} : { 'Content-Length': length },
      )
      await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
        category: 'response_too_large',
      })
      expect(cancel).toHaveBeenCalledOnce()
      expect(response.body!.locked).toBe(false)
    },
  )
  it('does not wait for a broken cancellation promise', async () => {
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(responseByteLimits.fees + 1))
        },
        cancel() {
          return new Promise(() => {})
        },
      }),
    )
    await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
      category: 'response_too_large',
    })
  })
  it('cancels malformed UTF-8 and releases the reader', async () => {
    const { response, cancel } = streamResponse([new Uint8Array([255]), encode('unread')])
    await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
      category: 'invalid_data',
    })
    expect(cancel).toHaveBeenCalledOnce()
    expect(response.body!.locked).toBe(false)
  })
  it('classifies a broken transport stream and attempts cancellation', async () => {
    const response = new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(new Error('private transport details'))
        },
      }),
    )
    const cancel = vi.fn()
    const getReader = response.body!.getReader.bind(response.body)
    vi.spyOn(response.body!, 'getReader').mockImplementation(() => {
      const active = getReader()
      const originalCancel = active.cancel.bind(active)
      vi.spyOn(active, 'cancel').mockImplementation(() => {
        cancel()
        return originalCancel()
      })
      return active
    })
    await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
      category: 'network',
      providerStatus: 200,
    })
    expect(cancel).toHaveBeenCalled()
    expect(response.body!.locked).toBe(false)
  })
  it.each(['<html>private response</html>', JSON.stringify({ fastestFee: -1 }), ''])(
    'rejects invalid JSON/data',
    async (body) => {
      await expect(fetchBitcoin('fees', fetchResponse(new Response(body)))).rejects.toMatchObject({
        category: 'invalid_data',
        providerStatus: 200,
      })
    },
  )
  it.each([302, 401, 404, 429, 500, 503])(
    'classifies HTTP %i and discards its body',
    async (status) => {
      const { response, cancel } = streamResponse([encode('private provider response')])
      const failed = new Response(response.body, { status })
      await expect(fetchBitcoin('fees', fetchResponse(failed))).rejects.toMatchObject({
        category: status === 429 ? 'rate_limit' : 'http',
        providerStatus: status,
      })
      expect(cancel).toHaveBeenCalledOnce()
    },
  )
  it('classifies network errors without retaining exception details', async () => {
    const error = await fetchBitcoin(
      'fees',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('secret')),
    ).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(UpstreamError)
    expect(error).toMatchObject({ category: 'network' })
    expect(String(error)).not.toContain('secret')
  })
  it('uses the 8s signal to recognize a Workers-style AbortError', async () => {
    const controller = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      expect(init?.signal?.aborted).toBe(false)
      controller.abort(new DOMException('private timeout', 'TimeoutError'))
      throw new DOMException('The operation was aborted', 'AbortError')
    })
    await expect(fetchBitcoin('fees', fetcher)).rejects.toMatchObject({ category: 'timeout' })
    expect(AbortSignal.timeout).toHaveBeenCalledWith(8_000)
  })
  it('times out and cancels a stalled body after headers', async () => {
    const controller = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    const cancel = vi.fn()
    const response = new Response(
      new ReadableStream({
        pull() {
          controller.abort(new DOMException('timeout', 'TimeoutError'))
        },
        cancel,
      }),
    )
    await expect(fetchBitcoin('fees', fetchResponse(response))).rejects.toMatchObject({
      category: 'timeout',
      providerStatus: 200,
    })
    expect(cancel).toHaveBeenCalledOnce()
  })
  it('keeps a non-timeout AbortError classified as a transport failure', async () => {
    await expect(
      fetchBitcoin(
        'fees',
        vi.fn<typeof fetch>().mockRejectedValue(new DOMException('', 'AbortError')),
      ),
    ).rejects.toMatchObject({ category: 'network' })
  })
  it('accepts a large histogram at the ceiling and rejects one extra entry in both contracts', async () => {
    const raw = {
      ...rawMempool,
      fee_histogram: Array.from({ length: MAX_HISTOGRAM_ENTRIES }, () => [
        0.123456789, 9007199254740991,
      ]),
    }
    expect(encode(JSON.stringify(raw)).byteLength).toBeLessThan(responseByteLimits.mempool)
    const result = await fetchBitcoin('mempool', fetchResponse(Response.json(raw)))
    expect(parseBitcoinResponse('mempool', result).data.feeHistogram).toHaveLength(
      MAX_HISTOGRAM_ENTRIES,
    )
    raw.fee_histogram.push([1, 1])
    expect(() => parseMempool(raw)).toThrow('Invalid histogram')
    result.data.feeHistogram.push({ feeRate: 1, virtualSizeBytes: 1 })
    expect(() => parseBitcoinResponse('mempool', envelope(result.data))).toThrow(
      'Invalid histogram',
    )
  })
  it('accepts a valid fee response split across chunks', async () => {
    const bytes = encode(JSON.stringify(rawFees))
    const { response, cancel } = streamResponse([bytes.slice(0, 10), bytes.slice(10)])
    expect((await fetchBitcoin('fees', fetchResponse(response))).data.fastest).toBe(2)
    expect(cancel).not.toHaveBeenCalled()
  })
})
