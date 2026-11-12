import { cancelBody, readBoundedText, UpstreamError } from './upstream'

// Server-only transport. Callers supply fixed provider URLs and freshly constructed headers.
export async function fetchProviderJson<T>(
  url: string,
  headers: Record<string, string>,
  normalize: (value: unknown) => T,
  rawLimit: number,
  normalizedLimit: number,
  fetcher: typeof fetch = fetch,
) {
  const timeout = AbortSignal.timeout(8_000)
  const controller = new AbortController()
  const signal = AbortSignal.any([timeout, controller.signal])
  let status: number | undefined
  try {
    const response = await fetcher(url, {
      method: 'GET',
      headers,
      signal,
      redirect: 'manual',
      cache: 'no-store',
    })
    status = response.status
    if (!response.ok) {
      cancelBody(response)
      throw new UpstreamError(status === 429 ? 'rate_limit' : 'http', status)
    }
    if (
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
      'application/json'
    ) {
      cancelBody(response)
      throw new UpstreamError('invalid_data', status)
    }
    const text = await readBoundedText(response, rawLimit, signal)
    try {
      const data = normalize(JSON.parse(text))
      if (new TextEncoder().encode(JSON.stringify(data)).byteLength > normalizedLimit)
        throw new Error('Oversized normalized response')
      return data
    } catch {
      throw new UpstreamError('invalid_data', status)
    }
  } catch (error) {
    const timedOut = timeout.aborted || (error instanceof Error && error.name === 'TimeoutError')
    controller.abort()
    if (timedOut) throw new UpstreamError('timeout', status)
    if (error instanceof UpstreamError) throw error
    throw new UpstreamError('network', status)
  }
}
