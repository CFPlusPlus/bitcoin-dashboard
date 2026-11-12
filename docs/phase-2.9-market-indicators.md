# Phase 2.9 – Market indicators and sats calculator

Date: 12 November 2026, Europe/Berlin. Feature branch:
`feature/phase-2.9-market-indicators`. `origin/main` was fetched before implementation
and still pointed to `b75c169495157018b5bf9a6eee97924249412568`. Since the Phase 2.8
merge, main changed the versioned Wrangler release settings: both snapshot and
history are enabled. Their actual current configuration takes precedence over
historical release notes. `wrangler.jsonc` is unchanged in this phase.

## Scope and implementation status

Implemented in the existing React/TypeScript/Vite/Pages application:

- Interactive BTC/sats/EUR/USD calculator using the existing snapshot query.
- Direct Bitcoin market-cap dominance from CoinGecko's global endpoint.
- Daily Crypto Fear & Greed value and provider classification from Alternative.me.
- Separate loading, unavailable, error, offline and retained stale states; visible
  attribution, source dates and successful retrieval dates.

No additional packages, persistence, Cloudflare services, navigation, modal flows,
historical indicator charts, trading or portfolio functionality. Existing snapshot,
price history, Blockchain and Mining behavior is preserved. Indicator and calculator
render failures have separate instances of the existing `ErrorBoundary`. Its
small additive `card` scope keeps the local fallback at h2 level and preserves
the card's grid span; the global/view/chart behavior stays unchanged.

**Code, local tests and live operation are different evidence levels.** The two
new external resources are implemented but default to disabled. All success data
in automated tests and screenshots is synthetic. No live CoinGecko account probe,
Alternative.me service probe, authenticated deployment check, secret change,
Cloudflare configuration change, merge or deployment was performed.

## Sources and checked contracts

Official references checked on 12 November 2026:

- [CoinGecko Demo global data](https://docs.coingecko.com/demo/reference/crypto-global):
  `GET https://api.coingecko.com/api/v3/global`, Demo key in the server-side
  `x-cg-demo-api-key` header; `data.market_cap_percentage.btc` is a percentage and
  `data.updated_at` is Unix seconds. The direct percentage avoids mixing the
  independently sampled snapshot and global capitalization. The global endpoint's
  other fields, including any sentiment field, are discarded.
- [CoinGecko API terms](https://www.coingecko.com/en/api_terms), particularly
  attribution, plan limits and caching/storage conditions, and the
  [attribution guide](https://brand.coingecko.com/resources/attribution-guide).
  The existing private, noncommercial Demo scope and unresolved account-specific
  release evidence in [ADR 0002](adr/0002-market-data-provider.md) remain applicable.
  No assumption about actual account quota or contractual approval is made here.
- [Alternative.me index, API and usage rules](https://alternative.me/crypto/fear-and-greed-index/):
  `GET https://api.alternative.me/fng/?limit=1&format=json`; no key required by
  the documented contract. The index is daily. Value, classification and Unix
  seconds are strings; `metadata.error` must be null. Attribution is placed inside
  the index card, immediately with the displayed data. No impersonation, external
  widgets or remotely loaded tracking assets. No numerical SLA or exact public
  request quota is assumed. `time_until_update` is deliberately unused.

The API category is translated, never inferred from local thresholds:

| Provider category | German display |
| ----------------- | -------------- |
| Extreme Fear      | Extreme Angst  |
| Fear              | Angst          |
| Neutral           | Neutral        |
| Greed             | Gier           |
| Extreme Greed     | Extreme Gier   |

## Additive same-origin API contracts

The existing snapshot and history success/error contracts are unchanged. Both new
endpoints accept **GET only, no query parameters**. Additional parameters fail
with 400 `INVALID_REQUEST`, other methods with 405 and `Allow: GET`, unknown
resources with 404, before any provider request.

`GET /api/market/dominance`:

```ts
{
  data: {
    btcPercent: number // finite, inclusive 0–100, no local derivation
    method: 'provider_market_cap_percentage'
  }
  source: 'coingecko'
  provider: {
    assetId: 'bitcoin'
    market: 'aggregated'
    attributionUrl: 'https://www.coingecko.com/en/api/'
  }
  updatedAt: string // successful validated retrieval, canonical ISO UTC
  sourceUpdatedAt: string // global data.updated_at, Unix seconds converted to ISO
}
```

`GET /api/market/fear-greed`:

```ts
{
  data: {
    value: number // integer, inclusive 0–100
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  }
  source: 'alternative.me'
  provider: {
    attributionUrl: 'https://alternative.me/crypto/fear-and-greed-index/'
  }
  updatedAt: string // successful validated retrieval, canonical ISO UTC
  sourceUpdatedAt: string // index publication timestamp, not retrieval time
}
```

Models and independent browser/server parsers extend `shared/market.ts` and
`shared/market-validation.ts`. Validation constructs small new objects and discards
unrecognized fields. Percentages/index ranges, classification enum, fixed source,
method, attribution URLs and both dates are checked. Unix seconds must be safe
integers and are multiplied by 1000 exactly once; millisecond provider timestamps
are rejected. Dates cannot precede Bitcoin genesis or exceed the current/retrieval
time by more than the existing five-minute clock tolerance. Old publication dates
are accepted and visibly marked stale; successful retrieval does not rejuvenate them.

## Transport, security and failure isolation

The CoinGecko adapter retains its existing snapshot/history normalization and adds
only global dominance. Alternative.me normalization is a separate adapter. Their
common bounded JSON transport is extracted into `functions/lib/provider-json.ts`,
reusing `readBoundedText`, strict UTF-8, cancellation and `UpstreamError`.

- Fixed HTTPS URLs, freshly constructed headers, no caller-provided host or proxy.
- No forwarded cookies, Access assertions, Authorization headers or redirects.
- Eight-second upstream deadline includes the body. One provider attempt, no server retry.
- New resources: 64 KiB raw response, 4 KiB normalized response. Existing snapshot
  and history byte limits are unchanged. Limits also apply to chunked bodies.
- Browser: existing 15-second deadline and 4 KiB bounded error envelopes.
- Responses retain `no-store`, `nosniff`, `DENY`, `no-referrer` and no CORS grant.
- Logs contain resource, safe category and optional status only; no keys, bodies,
  request headers, URLs or exception stacks. No new telemetry or secrets.

Existing error envelope: `{ error: { code, retryAfterSeconds? } }`. Missing
CoinGecko key returns 503 `MARKET_NOT_CONFIGURED`. An absent/non-`true` release
flag returns 503 `MARKET_NOT_RELEASED`. Alternative.me never requires the
CoinGecko key. Gates and secrets are checked before serving cached successes.
Provider 429 returns `UPSTREAM_RATE_LIMIT`, HTTP 429, `Retry-After: 600` and
`retryAfterSeconds: 600`. Timeout is 504 `UPSTREAM_TIMEOUT`; schema, body size,
UTF-8, media type and redirects are 502 `UPSTREAM_INVALID_RESPONSE`; provider
4xx is `UPSTREAM_CONFIGURATION`, network/5xx is `UPSTREAM_UNAVAILABLE`.
Untrusted provider text is never sent to the browser. Access errors retain the
existing login/reload recovery behavior.

CoinGecko snapshot/history/dominance share a cooldown in each Function instance
and each browser QueryClient. Alternative.me has its **own** cooldown and manual
refresh budget. Its 429 or outage cannot pause CoinGecko or prevent local calculation.
Refresh failures preserve the browser's last successful value and timestamps.
Empty failures never show invented numbers. There is no hidden server stale fallback.

## Cache and refresh policy

| Resource     | Server TTL / browser freshness | Retrieval warning | Source warning             |
| ------------ | ------------------------------ | ----------------- | -------------------------- |
| Dominance    | 15 minutes                     | 30 minutes        | 30 minutes                 |
| Fear & Greed | 6 hours                        | 12 hours          | 48 hours after publication |

These are application freshness targets, not provider guarantees. The daily index
can arrive later; a new publication can appear up to six hours after a previous
cached retrieval, and an uninterrupted open page can retain an older value until
refresh or reopen. Source age and fetch errors remain visible.

Both new browser queries use TanStack Query, **no interval polling**, no focus
refetch and no automatic retry. Stale resources load on reopen, visibility return
or reconnect; users can refresh manually after the existing 60-second pause.
Invisible initial mounts do not fetch. Query keys are `['market','dominance']`
and `['market','fear-greed']`. Garbage collection is twice TTL (at least 30 min).
Browser freshness subtracts elapsed time since original server retrieval, so a
server cache hit does not pretend to be newly collected data.

The existing instance-local cache is extended by two entries and two in-flight
promises: simultaneous same-resource requests share a load, fresh hits require no
upstream request, errors are never cached as successful data, and expiry removes
the entry before reloading. Cache hits preserve dates. Valid cache hits remain
available during provider cooldowns. Only public normalized data is cached, never
keys, cookies, login state or requests. History still has its ten existing entries;
snapshot behavior is unchanged. No Cache API, KV, D1 or Durable Objects.

**An instance-local cache is not a global quota guarantee.** Separate instances,
locations, cold starts, browser tabs and devices may generate additional loads.
Tabs do not share QueryClient memory. A reused live instance can coalesce their
requests, but no cross-tab or global coordination is promised. Dominance consumes
the same CoinGecko Demo account budget as snapshot/history and any other clients.
For scale only: repeated access every 15 minutes would allow up to 96 dominance
loads/day in one continuously reused instance; this is not a scheduled poll or an
upper bound across instances. Six hours/week at that rate is approximately 107
loads per 31 days before openings, failures and reserve. Recalculate the combined
budget against actual account limits and usage before activation; monitor 429 and
consumption. Alternative.me uses no CoinGecko quota.

## Calculator arithmetic and input rules

`src/lib/sats-calculator.ts` has no network calls. The component observes the same
`['market','snapshot']` query as `MarketSnapshot`; page currency changes and
calculator interactions do not add snapshot requests. Both fiat prices always
come from that one validated snapshot. Stale prices remain usable with an explicit
warning and their original source/retrieval dates. Without rates, BTC/sats remains
functional and fiat counterparts are unavailable.

- Decimal input and snapshot prices become BigInt numerator/denominator pairs.
  The canonical decimal representation of the existing numeric price is used,
  including exponent notation. This prevents additional binary arithmetic errors;
  it cannot recover precision already absent from the existing JSON-number contract.
- Exactly 100,000,000 sats per BTC. Sats input must be integral. All calculations
  retain the rational amount until each displayed result is rounded independently.
- Nonnegative half-up rounding: `floor((2*n + d)/(2*d))`. BTC has at most eight
  decimal places, sats none, fiat two. Fiat-to-fiat never passes through rounded sats.
- Positive BTC/fiat amounts that would display as zero show `< 0,00000001` or
  `< 0,01`. Sats still shows an integer, including zero below half a sat; a visible
  rounding note explains fractional-satoshi results. Trailing BTC zeros are omitted.
- German comma decimals and dot thousands groups; ungrouped decimal points are
  also accepted. `1.000` means one thousand, `0.001` means one thousandth.
  Pasted correctly grouped spaces, NBSP and narrow NBSP are accepted.
- No exponent input, signs, arbitrary characters or silently stripped currency
  symbols. Blank input is neutral; in-progress values such as `1,` remain usable.
  Invalid input stays editable and has `aria-invalid` plus a linked status message.
- Limits: 160 characters, 60 digits, 30 decimal places and at most 10³⁰ sats
  equivalent when conversion is possible. This is a computation/display limit,
  not a claim about Bitcoin supply. BigInt supports sats beyond `MAX_SAFE_INTEGER`.
- Unit changes reinterpret the preserved entered amount; they do not replace it
  with a rounded output. The calculator unit is independent of the page's chart fiat.

## Presentation and reuse

Existing card/grid, Manrope/Inter roles, semantic colors and market controls are
reused. History remains the main chart; the calculator fills the previous adjacent
card. Dominance and sentiment occupy the previous indicator area with compact
numbers, native semantic meters and German labels. No chart library is used for
indicators. Both themes have the same information and interaction. Source links
stay visible even when data is unavailable. Index publication and fetch time are
distinct. Native labels, keyboard controls, polite result announcements, minimum
44 px inputs and responsive wrapping support keyboard/touch and narrow screens.

## Verification and screenshots

Verification uses Node **22.22.2**, bundled npm **10.9.7**, existing installed
dependencies and an unchanged lockfile. Provider calls are mocked or intercepted
at the local workerd boundary. No production or external provider requests are
needed. Final results on 12 November 2026:

| Command                | Result                                                  |
| ---------------------- | ------------------------------------------------------- |
| `npm run lint`         | PASS, no warnings                                       |
| `npm run format:check` | PASS                                                    |
| `npm run typecheck`    | PASS, frontend, Functions, Functions tests and E2E      |
| `npm test`             | PASS, 638 tests in 26 files                             |
| `npm run build`        | PASS, production Vite build                             |
| `npm run pages:check`  | PASS, compiled Pages Worker, no deployment              |
| `npm run test:e2e`     | PASS, 136 Chromium/local Pages tests, about 1.4 minutes |
| `git diff --check`     | PASS                                                    |

The browser bundle contains no provider API hostname, Demo key header, secret
name, synthetic key or new provider raw payload. No dependency or lockfile changed.

Coverage includes exact conversions, sub-satoshi/cent amounts, large integers,
half-up boundaries, invalid/localized/pasted input, missing/stale rates and unit/page
currency changes; provider and browser contracts, all five categories, range/date
failures, Unix seconds, request credentials, invalid transport, body/header timeout,
rate limits, cache hits/expiry/concurrency and gates before warm caches; independent
providers, original-date browser freshness and absence of indicator polling.

Chromium exercises the complete page, both themes, desktop/mobile, real keyboard
selection, touch, errors, disabled flags, local-only conversion, existing chart
currency switching and no additional snapshot requests. The broader existing
suite also covers 320/768/1920 px and 200% text reflow. Compiled Pages integration
tests verify both new routes and gates against intercepted upstreams.

One existing lazy-chart test's default one-second element wait repeatedly expired
during the enlarged parallel suite but passed alone. Its first real asynchronous
module-load wait is now five seconds, keeping all error, retry and cleanup
assertions. No application chart behavior or global test timeout was changed.
The first GitHub CI run passed all unit/build checks and 135/136 browser tests.
Its existing snapshot keyboard-recovery test advanced virtual time before the
initial history request had settled, moving the shared CoinGecko refresh budget
on the slower runner. The test now waits for the history canvas and dominance
load, allows the existing 30-second display-clock tick after the 60-second minimum
pause, and checks button readiness before pressing Enter. Request counts, retained
timestamps and successful recovery assertions remain intact; no production policy
or application behavior was changed to accommodate the test.
The corrected keyboard-recovery test passed ten consecutive local Chromium runs.
Wrangler needs a local unsandboxed compiler/test process because its resolver
traverses parent directories; telemetry is disabled and logs stay in ignored
`.wrangler/analysis-logs`. This is local verification, not deployment.

All screenshots use **synthetic test fixtures**, not live prices/index readings:

- [Desktop dark, 1440 px](screenshots/phase-2.9/market-1440-dark-fixture.png)
- [Desktop light, 1440 px](screenshots/phase-2.9/market-1440-light-fixture.png)
- [Mobile dark, 390 px](screenshots/phase-2.9/market-390-dark-fixture.png)
- [Mobile light, 390 px](screenshots/phase-2.9/market-390-light-fixture.png)

The tests generate these under ignored `test-results/phase-2.9`; the reviewed
copies above are committed for review. This is local visual QA, not owner approval.

## Separate production release steps and remaining work

1. Review the PR and complete provider/account/budget/terms evidence for the
   intended private environment, including an authorized bounded schema check for
   `/global`. Confirm actual limits and remaining combined CoinGecko quota; no
   synthetic fixture establishes that account evidence.
2. Keep existing `MARKET_SNAPSHOT_ENABLED` and `MARKET_HISTORY_ENABLED` unchanged.
   In **Workers & Pages → bitcoin-dashboard → Settings → Variables and Secrets**,
   choose the intended environment, initially a separately authorized preview.
3. Dominance uses the existing server-only `COINGECKO_DEMO_API_KEY`. After explicit
   resource approval, set `MARKET_DOMINANCE_ENABLED` to exactly `true`. Do not use
   a `VITE_` key or expose it in build/client configuration.
4. After separate Alternative.me review, set `MARKET_FEAR_GREED_ENABLED` to exactly
   `true`. It needs no new secret. An absent/false flag keeps its provider disabled.
   This phase deliberately leaves both flags absent in the versioned configuration.
5. Perform an explicitly authorized deployment separately. Keep existing Access
   protection, verify all target hostnames and preview aliases, record deployed
   SHA and UTC check time, and check real values, timestamps, attribution, errors,
   rate limits and observed request budget through authenticated Access.
6. Production needs its own authorization and environment activation. To stop a
   resource, remove its flag or set it to false and verify effective deployment
   configuration. Retained browser data stays marked according to age/error.

The feature commit uses the `[CF-Pages-Skip]` prefix, so the requested branch
push/PR does not start a Pages deployment through the Git integration. This is
the documented [per-commit Pages skip mechanism](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/#skipping-a-build-via-a-commit-message),
not a change to Cloudflare project settings or the GitHub validation workflow.

No automatic deployment or merge is part of this work. Open evidence is the live
provider/account/Access verification and owner review. Deliberate technical limits
are instance-local caching, no global quota coordination, no indicator histories
and source-dependent freshness. There are no unverified substitute providers.
