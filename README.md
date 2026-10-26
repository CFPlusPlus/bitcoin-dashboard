# Bitcoin Dashboard

A private-use Bitcoin analytics dashboard in a public source repository. Overview and Blockchain use public Bitcoin mainnet data from mempool.space through same-origin Cloudflare Pages Functions. Market and mining metrics remain explicitly labeled placeholders. This repository does not configure authentication or deployment.

## Development

Use Node.js 22.22.2 (pinned in `.nvmrc`) and its bundled npm 10.9.7 (pinned in `package.json`). CI uses that bundled npm without a global npm installation and verifies its version against `packageManager`. The minimum Node version also satisfies the locked development dependencies.

```sh
nvm use
npm ci
npm run dev
npm test
npm run build
npm run pages:check
```

On Windows PowerShell with script execution disabled, use `npm.cmd`.

If your Node version manager does not read `.nvmrc`, select Node 22.22.2 explicitly. When updating dependencies, regenerate `package-lock.json` with npm 10.9.7 using `npm install --package-lock-only`, then verify with `npm ci` and the checks above. Keep the lockfile committed, including the overridden Undici dependency.

- `dev`: Vite frontend; `/api` is proxied to local Pages on port 8788.
- `pages:dev`: build and serve the SPA with Pages Functions locally on port 8788; no Cloudflare login needed.
- `preview`: frontend production-build preview only, without Functions.
- `pages:check`: compile Functions without deployment.
- CI runs tests, TypeScript checks, Vite build and Functions compilation. There is no deployment job.

## Stack and structure

React, TypeScript, Vite, Tailwind CSS v4, editable shadcn/ui primitives, Apache ECharts and TanStack Query. Inter is self-hosted through `@fontsource/inter`.

The lockfile pins the dependency graph. A version-scoped `undici@7.29.1` override pins Miniflare's Undici dependency to the patched 7.30.1 release while leaving jsdom's Undici 8 dependency unchanged. This form preserves the override with npm 10.9.7; remove it when Wrangler's dependency graph includes that fix itself. Miniflare's original `undici: 7.29.1` declaration remains in the lockfile metadata; the nested installed package must resolve to 7.30.1 through the override. Do not manually edit that upstream declaration. The lazy ECharts chunk currently triggers Vite's 500 kB advisory (approximately 171 kB gzip); it is loaded only on chart pages.

```text
src/components/ui/    Locally owned, adapted shadcn/ui primitives
src/components/       Theme, metrics, table and chart components
src/pages/            Four route components
src/lib/              Query client, Bitcoin queries, synthetic chart fixture and utilities
shared/               TypeScript API response and Bitcoin data models
src/test/             Behavior and API contract tests
functions/api/        Cloudflare Pages Functions
functions/lib/        Public mempool.space adapter and runtime validation
public/               Headers and Functions routing
```

`components.json` configures shadcn/ui with the `@/` alias and New York style. Further components can be added with `npx shadcn@latest add <component>`; review generated changes. Button and Card are editable local source, with no separate shadcn runtime.

## Routes and scope

| Route | German navigation | Prepared content |
| --- | --- | --- |
| `/` | Übersicht | Six KPIs, price chart, latest blocks, network status, halving progress |
| `/market` | Markt | Price/history, market cap, volume, ATH, dominance, Fear & Greed, sats calculator placeholder |
| `/blockchain` | Blockchain | Height, fees, mempool, blocks, block time, throughput, size, weight |
| `/mining` | Netzwerk & Mining | Hashrate, difficulty, adjustment, pools, halving, supply, inflation |

UI content is German; code and documentation are English. Overview and Blockchain show block height, latest blocks, recommended fees and mempool statistics. Blockchain additionally shows the latest block's size and weight and all five fee recommendations. Block time, throughput and other unconnected metrics remain em dashes with pending-data labels. The price chart still uses an explicitly labeled synthetic index, never fabricated Bitcoin prices. Analytics and calculator remain placeholders.

## Bitcoin data integration

All endpoints accept GET only and return `{ data, source: "mempool.space", updatedAt }`. `updatedAt` is the successful validated retrieval time in ISO 8601 UTC, not the block timestamp or a guarantee of provider freshness. The UI formats timestamps in the browser's local timezone. Resources are independently sampled; the tip can advance between requests. Latest-block size, weight and the table share one blocks snapshot in the UI.

| Pages endpoint | Public mempool.space endpoint | Normalized data |
| --- | --- | --- |
| `/api/bitcoin/height` | `/api/blocks/tip/height` | `height` |
| `/api/bitcoin/latest-block` | `/api/blocks` (first entry) | `Block` |
| `/api/bitcoin/blocks` | `/api/blocks` | Up to ten `Block` entries, newest first |
| `/api/bitcoin/fees` | `/api/v1/fees/recommended` | Five recommendations in sat/vB |
| `/api/bitcoin/mempool` | `/api/mempool` | Transaction count, virtual bytes, total satoshis, fee histogram |

The adapter validates required fields, finite nonnegative numbers, integer counts, block hashes, size limits, descending contiguous heights and histogram pairs. Unknown provider fields are discarded. Zero fees and an empty mempool are valid. Block sizes use decimal MB; weight uses MWU; mempool size uses MvB. Block timestamps are miner-reported Unix seconds.

Upstream requests use a fixed HTTPS origin, reject redirects and time out after eight seconds. Invalid payloads, network errors and upstream HTTP errors return JSON 502; timeouts return 504. No upstream diagnostics or credentials are forwarded. Unknown resources return 404 and unsupported methods 405. Responses use `Cache-Control: no-store`; there is no persistent database, KV, Cache API or other server cache.

TanStack Query keeps successful responses in browser memory, shares requests between components and routes, refreshes every 60 seconds while visible, and garbage-collects inactive queries after ten minutes. Data becomes stale after 60 seconds. Background polling pauses; stale data refreshes on return or reconnection. Failed transient requests retry once; client/access errors do not automatically retry. Browser requests time out after 15 seconds and are aborted on unmount when unused. No localStorage persistence or demo fallback is used for Bitcoin data.

Each live section displays the source and its last successful retrieval time, initial loading, recoverable errors and a stale warning. Refresh failures preserve the previous successful response and timestamp. A retry button allows recovery. Initial failures show no numeric values. Tests mock the upstream; test fixtures are never used by the application.

Run `npm run pages:dev` to exercise the full integration locally. For Vite hot reload, keep Pages running on port 8788 and run `npm run dev` in another terminal. Tests cover adapters, route errors, UI states, shared queries and background polling. API reference: [mempool.space REST API](https://mempool.space/docs/api/rest); polling behavior: [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/polling).

## Design system

Minimal Dark meets Advanced Analytics. Dark is the default regardless of OS preference. A manual toggle persists the theme in local storage; storage failure does not prevent toggling. An early inline script avoids theme flash.

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#0B0F14` | `#F6F8FA` |
| Cards | `#151A21` | `#FFFFFF` |
| Borders | `#252D37` | `#E2E7ED` |
| Accent | `#F7931A` | `#D97706` |

1600px maximum content width, 12-column desktop grid, 12px card radius, 16–20px gaps and 20–24px padding. Inter and tabular metric digits. Horizontal navigation wraps below the header and scrolls on narrow screens. No glass effects or chart animations. ECharts is lazy-loaded with selective imports; charts resize and dispose on unmount and theme change.

## Cloudflare and future access boundary

For Pages builds, use `.nvmrc` to select Node.js 22.22.2 and its bundled npm 10.9.7. Set the build command to `npm run build` and the output directory to `dist`. Pages v3 does not select Node or npm from `package.json`'s `engines`; those entries describe the supported toolchain. Remove any existing `NPM_VERSION=11.20.0` override or global npm installation from the Pages build settings, and remove a conflicting `NODE_VERSION` override or set it to `22.22.2`. Check both production and preview settings. A `Cannot find module 'promise-retry'` error during npm initialization indicates an incomplete npm installation; adding it to application dependencies cannot repair that bootstrap failure. If a previous broken npm installation persists, clear the Pages build cache before the next authorized build.

References: [Node.js 22.22.2 bundled npm](https://nodejs.org/en/download/archive/v22.22.2), [Pages build image and version selection](https://developers.cloudflare.com/pages/configuration/build-image/).

`wrangler.jsonc` declares `dist` as build output. File-based Functions expose `GET /api/health`; unknown `/api/*` endpoints return JSON 404. `_routes.json` invokes Functions only for `/api/*`. Pages' built-in SPA fallback supports deep links; do not add a top-level `404.html` unless replacing that behavior intentionally.

The eventual hostname is **bitcoin.falkner.info**, exclusively behind Cloudflare Access. This scaffold does **not** configure Access, DNS, a Pages project or a custom domain. Before deployment:

1. Create the Access application with an explicit allow policy for authorized identities and denial for everyone else.
2. Protect the custom domain and all alternate entry points: production `pages.dev`, preview deployments and branch aliases. Disable or protect unused aliases; protecting the custom domain alone is insufficient.
3. Verify unauthenticated HTML and `/api/*` requests are denied or redirected to authentication on every hostname.
4. Only then enable deployment and attach the domain. Do not enable automatic Git deployments before these checks.

Secrets belong in Cloudflare bindings or ignored `.dev.vars`, never `VITE_*` values or tracked source. Bitcoin requests use only public mainnet data and require no provider secret or private node. New endpoints stay under the existing `/api/*` routing and hostname-level Access boundary, add no CORS permission or bypass route, and do not change Access configuration. Access enforcement remains the responsibility of the existing Cloudflare application; local tests cannot verify deployed hostname policies. The unauthenticated HTML/API checks above still apply to every production and preview hostname. Package scripts intentionally contain no deployment command.

Setup references: [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite), [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).
