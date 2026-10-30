// Pages _headers applies to static assets only, so Functions set these explicitly.
export function jsonResponse(body: unknown, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      ...extraHeaders,
    },
  })
}

export function methodNotAllowed() {
  return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'GET' })
}
