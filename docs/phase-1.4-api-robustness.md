# Phase 1.4: API robustness and safe diagnostics

## Existing architecture and findings

The adapter already used fixed HTTPS endpoints, manual redirects, no forwarded
credentials, an 8-second upstream timeout and `no-store`. Provider parsers removed
unknown fields and checked finite nonnegative numbers, safe integers, hashes,
descending consecutive block heights, timestamps and block sizes. Zero values and
an empty mempool were supported. The browser validated normalized envelopes,
combined Query cancellation with a 15-second timeout and retained previous data
on a failed refetch. Existing UI tests cover retained values and success timestamps.

The remaining gaps were unbounded `response.text()`/`response.json()`, an unbounded
histogram, generic upstream errors with no safe diagnostics, timeout detection
based only on an exception name, different headers across Functions, and automatic
retries of malformed JSON, HTML and invalid normalized data.

## Response budgets

| Resource                 | Maximum streamed bytes | Rationale                                                                                                                                                               |
| ------------------------ | ---------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `height`                 |                    128 | One decimal safe integer (up to 16 digits), with generous whitespace headroom.                                                                                          |
| `latest-block`, `blocks` |        65,536 (64 KiB) | Both fetch the same list of up to ten block summaries, including provider fields discarded by normalization; over 6 KiB per block. No transaction bodies are requested. |
| `fees`                   |          4,096 (4 KiB) | Five numeric recommendations with ample room for formatting and additional provider fields.                                                                             |
| `mempool`                |      1,048,576 (1 MiB) | Three scalars and aggregated histogram pairs; deliberately much larger than small scalar responses.                                                                     |

Both the provider parser and shared browser validator allow at most **10,000
histogram entries**, checked before mapping. This is an application safety budget,
not a claimed provider protocol maximum. The histogram contains aggregated fee
bands, not one entry per transaction (see the [Esplora format](https://github.com/Blockstream/esplora/blob/master/API.md#mempool)).
Even 10,000 pairs of long JSON numbers fit well within 1 MiB (the regression test
uses fractional fee rates and maximum safe integer virtual sizes). This leaves
substantial headroom for normal responses without tying the limit to one live
snapshot. Future provider format changes may require revisiting these budgets.

The reader checks a numeric `Content-Length` before acquiring a reader, then counts
every delivered byte regardless of that header. Missing, malformed or understated
lengths cannot bypass the budget. This also bounds the body bytes exposed by the
runtime after any decoding. UTF-8 is decoded incrementally and strictly; JSON is
parsed only after a complete bounded read. No full intermediate byte buffer is
assembled; bounded text fragments are joined once for parsing. A single incoming
chunk is outside the application's allocation control, but oversized chunks are
rejected before decoding or retention.

Oversize responses, read/encoding failures and timeouts trigger cancellation;
failed requests also abort the fetch controller. Cancellation rejection is ignored
and cancellation is not awaited, so a broken source cannot postpone the original
failure. Reader locks and abort listeners are released. HTTP error bodies are
discarded without reading them. Malformed JSON is detected after the bounded body
has already been consumed.

## Internal categories and public compatibility

| Internal category    | Cause                                                            | Public status / code         |
| -------------------- | ---------------------------------------------------------------- | ---------------------------- |
| `timeout`            | Expired timeout signal or `TimeoutError`                         | 504 / `UPSTREAM_TIMEOUT`     |
| `network`            | Fetch or body transport failure                                  | 502 / `UPSTREAM_UNAVAILABLE` |
| `http`               | Non-success provider HTTP status except 429, including redirects | 502 / `UPSTREAM_UNAVAILABLE` |
| `rate_limit`         | Provider HTTP 429                                                | 502 / `UPSTREAM_UNAVAILABLE` |
| `invalid_data`       | Invalid UTF-8, JSON or provider schema                           | 502 / `UPSTREAM_UNAVAILABLE` |
| `response_too_large` | Declared or actual size exceeds budget                           | 502 / `UPSTREAM_UNAVAILABLE` |

The small `UpstreamError` class carries only category and optional provider status;
it does not retain the original exception or provider body. Unexpected route
failures are logged as `internal` and return the same generic 502. Public payloads,
resource paths, normalized models and source metadata remain compatible.

The route emits exactly one `console.error` object per failed upstream request:
`event`, allowlisted `resource`, `category`, and `providerStatus` when headers have
arrived. Successful requests, health checks, unknown routes and method rejections
are not logged. No exception message, cause, stack, request headers, URL, query,
cookies, credentials, payload or user identifier enters the log. Cloudflare's
native Function logs are used; no telemetry service or storage was added.

## Timeouts, retries and HTTP responses

The 8-second server timeout spans fetching headers and consuming the body. The
timeout signal is retained and inspected directly, so an aborted timeout is
recognized even if a runtime rejects with `AbortError`. A non-timeout `AbortError`
remains a transport failure. Body reading also observes cancellation explicitly.
Timeout signals are created inside the request, as required by the
[Workers runtime](https://developers.cloudflare.com/changelog/post/2026-08-19-abort-signal-global-scope/).

The browser retains its 15-second timeout, Query cancellation and 60-second refresh
intervals. Automatic retries remain limited to one, with the existing TanStack
delay, for network failures, transport timeouts and HTTP 5xx. HTTP 4xx, HTML,
malformed JSON and invalid normalized contracts are not automatically retried.
Body transport errors remain retryable and their UI message is sanitized. Manual
retry and periodic refresh remain available. Because the public 502 contract is
unchanged, provider rate limits and invalid upstream data still share that bounded
5xx retry behavior; there is no server retry or new public error code.

All existing Functions now explicitly return JSON with `Cache-Control: no-store`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and
`X-Frame-Options: DENY`. No CORS permissions are added. Known Bitcoin endpoints
and health accept GET; other methods return JSON 405 with `Allow: GET` (including
HEAD and OPTIONS). Unknown paths/resources remain JSON 404 for every method.
Health now handles method rejection explicitly instead of relying on routing
fallback behavior. [Pages `_headers`](https://developers.cloudflare.com/pages/configuration/headers/)
does not cover Function responses, so the small shared response helper sets the
headers on every success and error path. No application CSP is introduced.

## Validation and changed files

Controlled test streams and fetch mocks cover valid responses for every resource,
exact byte limits, split UTF-8, oversized declared and actual lengths, malformed or
missing lengths, cancellation (including a source whose cancellation never
resolves), malformed UTF-8/JSON, invalid schemas, transport failures, HTTP errors,
rate limits, timeout names and signal-based timeout recognition before and after
headers. Histogram tests exercise both contracts at and above the entry ceiling.
Route tests verify the exact safe log fields, public errors and headers for
successes, upstream failures, 404s and method rejections. Query tests verify actual
attempt counts, body timeouts, cancellation and retention of valid cached data.
Existing validation and UI tests remain in place. The old network-message
assertion now checks the structured `network` category because raw exception
messages are intentionally no longer propagated.

Changed production files: `functions/lib/mempool.ts`, new
`functions/lib/upstream.ts` and `functions/lib/response.ts`, all three existing
Function routes, `shared/bitcoin-validation.ts`, new `shared/bitcoin-limits.ts`,
and `src/lib/bitcoin.ts`. Tests: `src/test/functions.test.ts`,
`src/test/mempool.test.ts`, new `src/test/upstream-robustness.test.ts` and
`src/test/bitcoin-retry.test.ts`. This document and the README link document Phase
1.4. No dependency, visual design, polling interval or deployment configuration
changes are needed.

## Quality checks and limitations

Local validation passed: `npm ci` (0 audit vulnerabilities), `npm run lint`,
`npm run format:check`, `npm run typecheck`, `npm test` (154 tests in 9 files),
`npm run build` and `npm run pages:check`. On this Windows host use `npm.cmd`;
Wrangler's bundle check required sandbox escalation for its directory traversal
and log path. The local host provides Node 26.11.1 / npm 11.20.0, so installation
warned about the pinned npm version. The unchanged GitHub CI verifies the pinned
Node 22.22.2 / npm 10.9.7 toolchain; its results are linked from the pull request.

Tests deliberately do not depend on live provider availability. They simulate the
relevant abort behavior; they do not replace verification of deployed Cloudflare
Access policies or production logging settings. No deployment, server caching,
database, external monitoring or larger architectural change is part of this phase.
