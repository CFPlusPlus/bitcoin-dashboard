export type UpstreamCategory =
  'timeout' | 'network' | 'http' | 'rate_limit' | 'invalid_data' | 'response_too_large'

export class UpstreamError extends Error {
  constructor(
    public readonly category: UpstreamCategory,
    public readonly providerStatus?: number,
  ) {
    super(`Upstream failure: ${category}`)
  }
}

// Never await cancellation: a broken source must not delay the error response.
export function cancelBody(response: Response) {
  void response.body?.cancel().catch(() => {})
}

export async function readBoundedText(
  response: Response,
  limit: number,
  signal: AbortSignal,
): Promise<string> {
  const length = response.headers.get('content-length')
  if (length !== null && /^\d+$/.test(length) && Number(length) > limit) {
    cancelBody(response)
    throw new UpstreamError('response_too_large', response.status)
  }
  if (!response.body) throw new UpstreamError('invalid_data', response.status)
  const reader = response.body.getReader()
  const cancel = () => {
    void reader.cancel().catch(() => {})
  }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false })
    const parts: string[] = []
    let bytes = 0
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      signal.throwIfAborted()
      if (done) break
      bytes += value.byteLength
      if (bytes > limit) throw new UpstreamError('response_too_large', response.status)
      try {
        parts.push(decoder.decode(value, { stream: true }))
      } catch {
        throw new UpstreamError('invalid_data', response.status)
      }
    }
    try {
      parts.push(decoder.decode())
    } catch {
      throw new UpstreamError('invalid_data', response.status)
    }
    return parts.join('')
  } catch (error) {
    cancel()
    throw error
  } finally {
    signal.removeEventListener('abort', cancel)
    reader.releaseLock()
  }
}
