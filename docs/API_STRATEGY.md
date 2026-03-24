# API Strategy

## Purpose

This document describes how the current Bitcoin Dashboard API layer works in production and development. It focuses on what is implemented today: provider ownership, route responsibilities, normalization, caching, fallback behavior, and environment handling.

## API Boundary

The app uses Next.js route handlers under `src/app/api` as its internal backend boundary.

Current rules:

- the UI only consumes internal `/api/*` endpoints
- route handlers are responsible for validation, normalization, cache headers, and error mapping
- provider-specific request details stay in server code
- app-facing responses are typed through shared DTO contracts
- the homepage dashboard prefers bundled endpoints to reduce browser-to-worker request volume

## Current Provider Map

### CoinGecko

Owns:

- overview market data
- price chart data
- performance windows and long-range statistics
- market-context chart data

Current internal endpoints:

- `/api/overview`
- `/api/chart`
- `/api/performance`
- `/api/market-context-chart`

Runtime requirements:

- `COINGECKO_DEMO_API_KEY`
- optional KV fallback via `BITCOIN_DASHBOARD_CACHE`

### mempool.space

Owns:

- latest block height
- fee recommendations
- hashrate history
- difficulty adjustment data
- mempool block backlog
- recent block flow

Current internal endpoint:

- `/api/network`

Runtime requirements:

- none

### Alternative.me

Owns:

- Fear & Greed sentiment

Current internal endpoint:

- `/api/sentiment`

Runtime requirements:

- none

### Coin Metrics Community API

Owns:

- on-chain activity history used by the dashboard

Current internal endpoint:

- `/api/onchain-activity`

Runtime requirements:

- none

## Response Contracts

The UI consumes normalized app contracts rather than provider payloads.

Current response patterns include:

- shared envelope fields such as `source`, `fetchedAt`, optional `cache`, optional `partial`, and optional `warnings`
- overview DTOs with market and supply metrics
- chart DTOs with point arrays and summary stats
- market-context DTOs with named series for market cap and volume
- performance DTOs with fixed periods plus 52-week and volatility stats
- network DTOs with fees, mempool, hashrate, difficulty, recent blocks, and halving data
- sentiment DTOs with value, classification, timing, and attribution
- on-chain DTOs with current values, 7-day context, and derived metrics

Normalization rules:

- map upstream names to app-owned names
- keep only fields the app actually uses
- convert malformed or unavailable values to `null` when the overall payload is still usable
- attach warnings when only part of the upstream payload is available
- keep provider names out of UI-facing field names unless they are explicit metadata

Bundled dashboard responses:

- `/api/dashboard-core` groups overview, chart, and network sections for the main dashboard polling cycle
- `/api/dashboard-slow` groups sentiment, on-chain activity, performance, and market-context sections for the slower dashboard polling cycle
- bundle routes preserve section-level errors so the client can keep rendering usable sections when sibling sections still succeed

## Current Endpoint Behavior

### `/api/overview`

Purpose:

- normalized market snapshot for the selected currency
- USD reference price for cross-currency context
- BTC dominance from CoinGecko global data

Behavior:

- requires a valid `currency` query param when supplied
- returns partial warnings if secondary upstream pieces fail
- uses CoinGecko KV fallback metadata when available

### `/api/chart`

Purpose:

- normalized BTC price chart for `1`, `7`, or `30` days

Behavior:

- validates `days`
- validates optional `currency`
- uses CoinGecko KV fallback metadata when available

### `/api/performance`

Purpose:

- long-range performance and structural market context

Behavior:

- uses a 365-day CoinGecko chart source
- derives `7d`, `30d`, `90d`, `1y`, and `YTD` periods plus 52-week and volatility stats
- uses CoinGecko KV fallback metadata when available

### `/api/market-context-chart`

Purpose:

- 30-day normalized series for market cap and volume context

Behavior:

- validates optional `currency`
- uses CoinGecko KV fallback metadata when available

### `/api/network`

Purpose:

- current network state and fee environment from mempool.space

Behavior:

- combines multiple upstream requests in parallel
- returns partial payloads with warnings when one or more subsections fail
- fails with `502` only when every upstream request fails

### `/api/onchain-activity`

Purpose:

- recent on-chain activity context from Coin Metrics

Behavior:

- returns a normalized 7-day view with derived metrics
- currently fails as a whole when no usable provider payload is available

### `/api/sentiment`

Purpose:

- Fear & Greed value with short-term context and update timing

Behavior:

- fetches the latest 7 entries
- currently fails as a whole when no usable provider payload is available

### `/api/dashboard-core`

Purpose:

- reduce homepage request fan-out by bundling overview, chart, and network responses

Behavior:

- accepts the same `currency` and `days` shape needed by the bundled overview and chart sections
- returns section-level payloads and section-level errors in one response
- keeps the overall bundle usable when one or two sibling sections fail

### `/api/dashboard-slow`

Purpose:

- bundle slower-moving homepage sections into a single request

Behavior:

- accepts the same `currency` shape needed by the bundled performance and market-context sections
- returns section-level payloads and section-level errors in one response
- keeps the overall bundle usable when one or more sibling sections fail

## Caching Strategy

Caching is defined at the route boundary and mirrored in upstream fetch behavior.

### Current cache policies

- `overview`: browser `60s`, edge revalidate `300s`, stale-while-revalidate `900s`
- `chart` for `1d` and `7d`: browser `60s`, edge revalidate `300s`, stale-while-revalidate `900s`
- `chart` for `30d`: browser `300s`, edge revalidate `900s`, stale-while-revalidate `1800s`
- `performance`: browser `300s`, edge revalidate `1800s`, stale-while-revalidate `7200s`
- `market-context-chart`: browser `300s`, edge revalidate `900s`, stale-while-revalidate `1800s`
- `network`: browser `5s`, edge revalidate `20s`, stale-while-revalidate `40s`
- `sentiment`: browser `300s`, edge revalidate `900s`, stale-while-revalidate `3600s`
- `onchain-activity`: browser `300s`, edge revalidate `1800s`, stale-while-revalidate `7200s`
- `dashboard-core`: browser `30s`, edge revalidate `120s`, stale-while-revalidate `240s`
- `dashboard-slow`: browser `300s`, edge revalidate `900s`, stale-while-revalidate `3600s`

### CoinGecko KV fallback

CoinGecko-backed routes currently use a second cache layer when `BITCOIN_DASHBOARD_CACHE` is available.

Behavior:

- fresh KV entries can satisfy requests without hitting CoinGecko
- fresh upstream responses are written back to KV
- stale KV entries can be served when CoinGecko fails
- stale responses are marked through cache metadata and human-readable warnings

This currently applies to:

- `/api/overview`
- `/api/chart`
- `/api/performance`
- `/api/market-context-chart`

## Error Handling

Current error-handling rules:

- invalid client input returns `400`
- missing required server configuration returns `500`
- total upstream failure returns `502`
- user-facing errors stay concise and sanitized
- provider-specific debugging details stay near the server boundary
- raw provider payloads and secrets are never exposed directly to the UI

Shared implementation pieces:

- `src/server/http.ts` for JSON and error responses
- `src/server/provider-fetch.ts` for upstream requests and timeouts
- `src/server/upstream.ts` for structured upstream error modeling

## Partial Failure Rules

The app deliberately preserves useful data when it can do so safely.

Current examples:

- `/api/overview` can return market data even when the USD reference or global dominance request fails
- `/api/network` can return a usable payload when one or more mempool.space requests fail
- CoinGecko stale KV data can keep chart or overview routes usable during upstream outages

Rules:

- set `partial: true` when the payload is incomplete but still useful
- include warnings that explain what is missing or degraded
- use `null` for missing values instead of ad hoc shape changes
- for bundled dashboard routes, preserve per-section errors instead of failing the entire bundle when sibling sections still have usable data

## Environment And Runtime

### Required now

- `COINGECKO_DEMO_API_KEY`

### Used in deployed Workers

- `BITCOIN_DASHBOARD_CACHE` KV binding for CoinGecko fallback caching

Current runtime rules:

- env values are read only through `src/server/env.ts`
- provider auth stays server-side
- local development uses `.dev.vars`
- production bindings are configured through Wrangler and the Cloudflare Worker environment

## Implementation Rules

When changing or adding a provider-backed route:

1. decide which provider owns the domain
2. define or extend the normalized DTO contract
3. keep provider access in `src/server` or the route handler server layer
4. normalize before returning JSON
5. set cache policy intentionally
6. define partial-failure behavior explicitly
7. return user-safe errors and server-useful details
8. preserve the app contract even if a provider later changes

## Decision Summary

The current API strategy is stable and production-oriented:

- providers are called only on the server
- route handlers are the normalization boundary
- the UI consumes app-owned contracts only
- caching is explicit per route
- CoinGecko routes use KV fallback when available
- partial responses are preferred over total failure when safe
