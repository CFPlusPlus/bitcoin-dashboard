# API Strategy

## Purpose

This document defines how the Bitcoin Dashboard integrates external data providers and how API-related code should handle normalization, caching, resilience, and future provider changes.

The app runs on Next.js App Router route handlers and is deployed to Cloudflare Workers through OpenNext. In this architecture, route handlers are the server-side boundary between upstream providers and the UI.

This document is meant to guide future implementation work so provider access stays consistent, portable, and predictable as the dashboard grows.

## Current providers

### CoinGecko

Used for Bitcoin market and chart data.

Current domains:

- overview market data for BTC in USD and EUR
- chart time-series data for the supported ranges

Current internal endpoints:

- `/api/overview`
- `/api/chart`

Current auth/environment requirement:

- `COINGECKO_DEMO_API_KEY`

### mempool.space

Used for Bitcoin network data.

Current domains:

- recommended fees
- latest block height

Current internal endpoint:

- `/api/network`

Current auth/environment requirement:

- none

### Alternative.me

Used for sentiment data.

Current domains:

- Fear & Greed Index

Current internal endpoint:

- `/api/sentiment`

Current auth/environment requirement:

- none

## Provider responsibilities

Each external provider should own a clearly defined data domain inside the app.

Current ownership split:

- CoinGecko owns market snapshot and chart data
- mempool.space owns Bitcoin network state and fee recommendations
- Alternative.me owns Fear & Greed sentiment data

Rules:

- A provider should be used for the domain it is already responsible for unless there is a deliberate strategy change.
- Route handlers may combine multiple upstream requests inside one domain when needed, but the UI should still see one app-facing response.
- Provider-specific request details, headers, query parameters, parsing, and upstream error interpretation belong in server code only.
- Shared provider logic should live in `src/server` once it is reused by more than one route or becomes large enough to distract from route readability.
- UI components, views, and client hooks must not know provider URLs, auth headers, or raw upstream schemas.

## Normalization policy

Normalization must happen server-side before data reaches the UI.

Required rules:

- Route handlers return app-specific response shapes.
- UI code should consume shared internal contracts from `src/types`, not raw provider objects.
- Mapping from provider fields to app fields happens in route handlers or extracted server helpers.
- Provider naming should not leak into UI data structures except in explicit metadata such as `source` or attribution text.
- Missing or invalid upstream values should be converted to safe app-level values such as `null`, `partial: true`, and `warnings`.

Current normalized response patterns already used by the app:

- a shared envelope with `source`, `fetchedAt`, optional `partial`, and optional `warnings`
- overview fields mapped to app-friendly names like `priceUsd`, `marketCapEur`, and `lastUpdatedAt`
- chart data mapped to `points` and computed `stats`
- network data mapped to `latestBlockHeight` plus a normalized `fees` object
- sentiment data mapped to `value`, `classification`, `timestamp`, `nextUpdateAt`, and attribution

Server-side normalization responsibilities include:

- renaming fields
- selecting only the fields the app actually uses
- converting text or mixed-type upstream values into typed app values
- filtering malformed records
- computing lightweight derived fields needed across the UI
- attaching warnings and partial-state metadata when only part of the upstream payload is usable

## Caching strategy

### General policy

The first-pass strategy is route-level caching through response headers on internal `/api/*` endpoints.

Rules:

- Cache at the app-facing route handler boundary, not in UI components.
- Choose cache windows based on how fast the data changes, provider rate limits, and whether slightly stale data is acceptable for the user experience.
- Prefer a small amount of safe staleness over aggressive refetching that increases cost or rate-limit risk.
- When two parts of the UI need the same upstream data, they should reuse the same internal endpoint rather than making separate provider calls.
- If future features reuse the same provider/domain data across routes, centralize the fetch layer in `src/server` and share the same cache policy.

### Overview data

Domain:

- current BTC market snapshot from CoinGecko

First-pass caching policy:

- `Cache-Control: public, max-age=60`

Guidance:

- Five minutes is a reasonable balance between freshness and CoinGecko demo-key limits.
- Overview cards are read as a snapshot, so brief staleness is acceptable.
- Stale-but-safe data is acceptable here as long as the response still includes `fetchedAt` and any partial-state warnings.

### Chart data

Domain:

- BTC chart data from CoinGecko by currency and selected range

First-pass caching policy:

- `Cache-Control: public, max-age=60`

Guidance:

- Chart interactions can trigger repeated requests as users switch range or currency, so caching should suppress duplicate provider traffic.
- Five minutes is acceptable because the chart is for lightweight context, not tick-level trading decisions.
- Stale-but-safe data is acceptable when the app still returns the requested range/currency and marks any dropped points via warnings.

### Network data

Domain:

- recommended fees and latest block height from mempool.space

First-pass caching policy:

- `Cache-Control: public, max-age=30`

Guidance:

- Network conditions can change faster than sentiment, so this window should stay shorter than overview and sentiment.
- Thirty seconds reduces unnecessary polling while keeping fees reasonably current for dashboard use.
- Slight staleness is acceptable, but this domain should stay the freshest of the current endpoints because fee guidance is more time-sensitive.

### Sentiment data

Domain:

- Fear & Greed data from Alternative.me

First-pass caching policy:

- `Cache-Control: public, max-age=300`

Guidance:

- Sentiment updates much less frequently than market or network data.
- A five-minute cache window is appropriate and conservative.
- Stale-but-safe data is clearly acceptable here because the indicator is slow-moving and informational.

### Revalidation and freshness guidance

Current guidance:

- Keep current `max-age` values as the baseline until real usage or provider constraints justify a change.
- Prefer consistent route-level cache headers over ad hoc fetch behavior scattered across the codebase.
- If provider pressure increases, extend cache windows before adding more complex behavior.
- If a future feature becomes more latency-sensitive, revisit the endpoint policy explicitly instead of bypassing the server boundary.

For Cloudflare Workers deployments:

- internal routes should remain the single place where cache intent is expressed
- any future use of platform-specific cache layers must preserve the same normalized response contracts
- platform-specific caching must remain an optimization, not a new data contract boundary

## Error handling strategy

### General policy

Errors should be handled at the route-handler boundary and converted into predictable app-facing responses.

Rules:

- Upstream provider errors must not leak raw response bodies or stack traces directly to the UI.
- Route handlers should return concise user-safe errors and optional sanitized details.
- Partial upstream success should return a successful normalized payload with `partial: true` and `warnings`.
- Total upstream failure for an endpoint should return an error response with an appropriate 5xx status, typically `502` for provider failures.
- Invalid client input should return `400`.
- Missing required server configuration should return `500`.

### Upstream outage handling

Expected behavior:

- timeouts, non-2xx responses, parse failures, and malformed payloads are treated as upstream/provider failures
- these should be translated into app-facing error responses or warnings, depending on whether any useful data remains
- timeout handling should stay centralized through shared server helpers such as `fetchWithTimeout`

### Partial failure behavior

Partial failure is acceptable when one part of a domain succeeds and another part fails.

Current examples:

- `/api/overview` can return data when either USD or EUR market data succeeds
- `/api/network` can return data when either fee data or block height succeeds
- `/api/chart` and `/api/sentiment` currently require a usable primary payload and fail if none is available

Rules:

- If at least one meaningful subsection of the payload can be returned safely, prefer a partial normalized response over a hard failure.
- Partial responses must explicitly set `partial: true`.
- Partial responses should include human-readable warnings that explain what is unavailable.
- Missing fields in partial responses should resolve to `null`, not omitted ad hoc shapes.

### Fallback response expectations

Fallback behavior should be simple and explicit.

Rules:

- Do not silently swap providers inside a route without documenting that strategy.
- Do not fabricate market, network, or sentiment values when the provider fails.
- Use `null` for unavailable values when the surrounding response is still meaningful.
- Include `source` and `fetchedAt` whenever a successful or partial payload is returned.

### User-facing errors vs internal logging

User-facing responses should:

- explain that data could not be loaded
- avoid provider implementation noise unless it helps diagnose a safe, actionable issue
- keep wording stable enough for the UI to present clean error states

Internal/server handling should:

- preserve enough sanitized detail to debug provider issues
- keep timeout and status-code context near the server boundary
- avoid exposing secrets, raw auth material, or unbounded upstream response bodies

Current implementation note:

- the app already truncates upstream error bodies through shared helpers, which should remain the default pattern

## Rate-limit awareness and portability

The app should assume that external providers can change limits, schemas, or availability at any time.

Required rules:

- avoid unnecessary duplicate provider calls for the same app need
- centralize provider access patterns so request headers, parsing, and retries are not duplicated
- keep route handlers as stable app-facing contracts even if the upstream provider changes later
- do not let UI code depend on provider-specific fields, query conventions, or enum values
- if a provider needs to be replaced, the change should be mostly isolated to route/server modules and shared types should only change if the app contract truly changes

Practical guidance:

- if multiple routes need the same CoinGecko logic, move it into `src/server`
- if provider auth, retries, or validation grow more complex, centralize them once rather than copy/pasting route code
- prefer one well-defined internal endpoint per app domain over multiple slightly different wrappers around the same upstream resource

## Environment variables

### Current state

The project currently uses:

- `COINGECKO_DEMO_API_KEY`

This key is required for the current CoinGecko integration used by:

- `/api/overview`
- `/api/chart`

### Local development

Local development should use `.dev.vars`.

Rules:

- define `COINGECKO_DEMO_API_KEY` in `.dev.vars`
- do not commit `.dev.vars`
- local route handlers should fail clearly if the key is missing rather than attempting an unauthenticated fallback

### Production

Production should provide the same variable through the Cloudflare Worker environment.

Rules:

- production config must define `COINGECKO_DEMO_API_KEY`
- route handlers should read runtime env values through `src/server/env.ts`
- env access should remain server-only and not leak into client bundles

## Implementation rules for future API work

When adding or changing provider-backed functionality:

1. Decide which provider owns the domain and document it if it is new.
2. Define or extend the normalized app contract in `src/types`.
3. Implement provider access in a route handler or extracted `src/server` helper.
4. Normalize upstream data before returning any JSON to the UI.
5. Set an explicit cache policy for the route.
6. Define partial-failure behavior up front.
7. Return user-safe errors and server-useful details.
8. Keep the route contract stable even if the upstream provider later changes.

## Decision summary

The API strategy for this project is:

- external providers are accessed only on the server
- route handlers are the proxy and normalization boundary
- the UI consumes app-specific response shapes only
- route-level cache headers define the first-pass freshness policy
- partial responses are preferred over full failure when safe
- provider-specific logic should become shared `src/server` code once reuse appears
- environment variables stay server-side and are read through centralized runtime helpers

This keeps the dashboard resilient on Cloudflare Workers today and makes future provider swaps or API expansion much easier to manage.
