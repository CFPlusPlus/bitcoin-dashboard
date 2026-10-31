# Bitcoin Dashboard

A private-use Bitcoin analytics dashboard in a public source repository. Overview and Blockchain use public Bitcoin mainnet data from mempool.space through same-origin Cloudflare Pages Functions. Mining includes a difficulty forecast. The CoinGecko USD/EUR market snapshot is implemented behind a disabled server release gate; account, usage-rights and authenticated schema evidence remain required. Deployment configuration is versioned here; Cloudflare Access and project settings are managed externally.

See [Phase 2.7: market snapshot and release evidence](docs/phase-2.7-market-snapshot.md). `COINGECKO_DEMO_API_KEY` belongs exclusively in the server-side Cloudflare Pages Secrets for the intended environment. `MARKET_SNAPSHOT_ENABLED` defaults to `false`; neither adding a secret nor merging code authorizes provider use. Historical data is deferred to Phase 2.8.

See [Phase 1.4: API robustness and safe diagnostics](docs/phase-1.4-api-robustness.md) for response budgets, error categories, logging, HTTP headers and retry rules.

## Development

Use Node.js 22.22.2 (pinned in `.nvmrc`) and its bundled npm 10.9.7 (pinned in `package.json`). CI uses that bundled npm without a global npm installation and verifies its version against `packageManager`. The minimum Node version also satisfies the locked development dependencies.

```sh
nvm use
npm ci
npm run dev
npm run lint
npm run format:check
npm test
npm run typecheck
npm run build
npm run pages:check
npx --no-install playwright install --only-shell chromium
npm run test:e2e
```

On Windows PowerShell with script execution disabled, use `npm.cmd`.

If your Node version manager does not read `.nvmrc`, select Node 22.22.2 explicitly. When updating dependencies, regenerate `package-lock.json` with npm 10.9.7 using `npm install --package-lock-only`, then verify with `npm ci` and the checks above. Keep the lockfile committed, including the overridden Undici dependency.

- `dev`: Vite frontend; `/api` is proxied to local Pages on port 8788.
- `pages:dev`: build and serve the SPA with Pages Functions locally on port 8788; no Cloudflare login needed.
- `preview`: frontend production-build preview only, without Functions.
- `lint` / `lint:fix`: ESLint flat config with recommended JavaScript and TypeScript rules, React Hooks and Vite React Refresh checks; warnings fail CI. Browser, Vitest, Node configuration and Worker environments are scoped separately. TypeScript remains responsible for type safety through the existing strict configurations.
- `format` / `format:check`: write or check Prettier formatting (two spaces, single quotes, no JavaScript/TypeScript semicolons, 100-column target, LF). The Tailwind CSS 4 plugin reads `src/index.css` and sorts classes, including `cn` and `cva` calls. Dependencies, build output, coverage, Wrangler state and the npm-generated lockfile are excluded.
- `typecheck`: check frontend, Cloudflare Functions and Functions tests separately. `tsconfig.functions-tests.json` extends the Functions configuration, including its strict checks and Worker types, without adding browser DOM globals. The frontend excludes `src/test/functions.test.ts` and `src/test/market-functions.test.ts`; the dedicated Functions-test check covers them and their imports.
- `build`: run all TypeScript checks before the Vite production build.
- `pages:check`: compile Functions without deployment.
- `test:e2e`: Chromium UI tests and real HTTP smoke tests against the production `dist` build in local Wrangler Pages on port 8799. Run `build` first; no Cloudflare login or public API availability required. On Linux, install Chromium with `npx --no-install playwright install --with-deps --only-shell chromium`.
- Before opening a PR, run `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`, `npm run pages:check` and `npm run test:e2e`. Use `lint:fix` or `format` for intended changes and review their diff.
- CI runs lint and formatting checks after `npm ci`, then tests, TypeScript checks, Vite build, Functions compilation and local Pages smoke/E2E tests with Chromium. Any failed check fails the job. There is no deployment job. See [Pages deployment and Access verification](docs/cloudflare-pages-verification.md) for test scope, diagnostics and the separate external release gate.

Development quality tools are ESLint 10.13.0, typescript-eslint 8.72.1, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, Prettier 3.9.10 and prettier-plugin-tailwindcss 0.8.1. Direct tool versions and the lockfile are pinned; eslint-config-prettier keeps ESLint's rules compatible with the formatter. Tailwind v4 integration follows the [plugin's stylesheet configuration](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#specifying-your-tailwind-stylesheet-path-tailwind-css-v4).

## Stack and structure

React, TypeScript, Vite, Tailwind CSS v4, editable shadcn/ui primitives, Apache ECharts and TanStack Query. Manrope and Inter are self-hosted through curated, licensed WOFF2 assets in `public/fonts`.

The lockfile pins the dependency graph. A version-scoped `undici@7.29.1` override pins Miniflare's Undici dependency to the patched 7.30.1 release while leaving jsdom's Undici 8 dependency unchanged. This form preserves the override with npm 10.9.7; remove it when Wrangler's dependency graph includes that fix itself. Miniflare's original `undici: 7.29.1` declaration remains in the lockfile metadata; the nested installed package must resolve to 7.30.1 through the override. Do not manually edit that upstream declaration. The lazy ECharts chunk currently triggers Vite's 500 kB advisory (approximately 171 kB gzip); it is loaded only on chart pages.

```text
src/components/ui/    Locally owned, adapted shadcn/ui primitives
src/components/       Theme, metrics, table and chart components
src/pages/            Four route components
src/lib/              Query client, Bitcoin queries, synthetic chart fixture and utilities
src/styles/           Semantic design tokens and local font declarations
shared/               TypeScript API response and Bitcoin data models
src/test/             Behavior and API contract tests
functions/api/        Cloudflare Pages Functions
functions/lib/        Public mempool.space adapter and runtime validation
public/               Headers, Functions routing and licensed local fonts
```

`components.json` configures shadcn/ui with the `@/` alias and New York style. Further components can be added with `npx shadcn@latest add <component>`; review generated changes. Button and Card are editable local source, with no separate shadcn runtime.

## Routes and scope

| Route         | German navigation | Prepared content                                                                             |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `/`           | Übersicht         | Six KPIs, price chart, latest blocks, network status, halving progress                       |
| `/market`     | Markt             | Price/history, market cap, volume, ATH, dominance, Fear & Greed, sats calculator placeholder |
| `/blockchain` | Blockchain        | Height, fees, mempool, blocks, block time, throughput, size, weight                          |
| `/mining`     | Netzwerk & Mining | Hashrate, difficulty, adjustment, pools, halving, supply, inflation                          |

UI content is German; code and documentation are English. Overview and Blockchain show block height, latest blocks, recommended fees and mempool statistics. Blockchain additionally shows the latest block's size and weight and all five fee recommendations. Block time, throughput and other unconnected metrics remain em dashes with pending-data labels. The price chart still uses an explicitly labeled synthetic index, never fabricated Bitcoin prices. Analytics and calculator remain placeholders.

## React error recovery

`ErrorBoundary` uses React's class boundary API without additional dependencies. Three placements keep failures contained:

- `src/main.tsx`: the global boundary surrounds the query, theme and router providers. Its standalone German fallback has its own main landmark and reload action, without requiring dashboard layout or provider context.
- `src/App.tsx`: one view boundary surrounds `Routes` inside the existing main content. Header, navigation, theme controls and footer remain available. React Router's location key remounts the boundary on navigation, including back/forward and returning to a previously failed view.
- `src/components/dashboard.tsx`: a chart boundary surrounds Suspense and the lazy ECharts component inside the existing card. Other cards and chart labels remain visible when importing, rendering or mounting the chart fails.

Unexpected view and chart rendering failures offer a local retry that remounts the failed subtree, plus a document reload. A persistent error returns to the fallback. Dynamic chart import rejections are explicitly wrapped as `ComponentLoadError`; these offer only document reload. React caches lazy loaders and their rejected promises, and browser module caches can also prevent a local remount from requesting a failed module again. Reload starts a fresh application load but cannot guarantee recovery while network, deployment or code failures persist. Existing API/network status, query retry and cached data behavior remain unchanged.

Fallbacks use the existing Button and theme tokens, semantic headings and `role="alert"`. No exception messages, causes or stacks are rendered. The global fallback works without the theme provider and uses the document's current light/dark tokens (light defaults if theme initialization itself fails).

Diagnostics deliberately retain React 19's default reporting. React exposes `onCaughtError`, `onUncaughtError` and `onRecoverableError` on `createRoot`, including component-stack information; no additional `componentDidCatch` logger or root callback duplicates those reports. Developer diagnostics stay in the local console/development tools. There is no custom monitoring, external telemetry endpoint or personal-data transmission; future monitoring would be a separate, optional change. See the official [createRoot reference](https://react.dev/reference/react-dom/client/createRoot) and [lazy cache behavior](https://react.dev/reference/react/lazy).

`src/test/error-boundaries.test.tsx` and `src/test/chart-load-error.test.tsx` cover healthy rendering, standalone fallback and reload in both theme states, view retry and persistent failures, navigation/reset, lazy loading and import rejection, local chart recovery, hidden error details and unchanged API refetch recovery. The existing browser-location test verifies that the reload helper calls `window.location.reload()`. DOM tests verify behavior and theme state; they do not verify pixel appearance or real network recovery after a browser reload. Boundaries do not handle event-handler exceptions, unrelated asynchronous callbacks, failures before React starts, or errors in their own fallback.

## Bitcoin data integration

All endpoints accept GET only and return `{ data, source: "mempool.space", updatedAt }`. `updatedAt` is the successful validated retrieval time in ISO 8601 UTC, not the block timestamp or a guarantee of provider freshness. The UI formats timestamps in the browser's local timezone. Resources are independently sampled; the tip can advance between requests. Latest-block size, weight and the table share one blocks snapshot in the UI.

| Pages endpoint              | Public mempool.space endpoint | Normalized data                                                 |
| --------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `/api/bitcoin/height`       | `/api/blocks/tip/height`      | `height`                                                        |
| `/api/bitcoin/latest-block` | `/api/blocks` (first entry)   | `Block`                                                         |
| `/api/bitcoin/blocks`       | `/api/blocks`                 | Up to ten `Block` entries, newest first                         |
| `/api/bitcoin/fees`         | `/api/v1/fees/recommended`    | Five recommendations in sat/vB                                  |
| `/api/bitcoin/mempool`      | `/api/mempool`                | Transaction count, virtual bytes, total satoshis, fee histogram |

The adapter validates required fields, finite nonnegative numbers, integer counts, block hashes, size limits, descending contiguous heights and histogram pairs. Unknown provider fields are discarded. Zero fees and an empty mempool are valid. Block sizes use decimal MB; weight uses MWU; mempool size uses MvB. Block timestamps are miner-reported Unix seconds.

Upstream requests use a fixed HTTPS origin, reject redirects and time out after eight seconds. Invalid payloads, network errors and upstream HTTP errors return JSON 502; timeouts return 504. No upstream diagnostics or credentials are forwarded. Unknown resources return 404 and unsupported methods 405. Responses use `Cache-Control: no-store`; there is no persistent database, KV, Cache API or other server cache.

TanStack Query keeps successful responses in browser memory, shares requests between components and routes, refreshes every 60 seconds while visible, and garbage-collects inactive queries after ten minutes. Data becomes stale after 60 seconds. Background polling pauses; stale data refreshes on return or reconnection. Failed transient requests retry once; client/access errors do not automatically retry. Browser requests time out after 15 seconds and are aborted on unmount when unused. No localStorage persistence or demo fallback is used for Bitcoin data.

Each live section displays the source and its last successful retrieval time, initial loading, recoverable errors and a stale warning. Refresh failures preserve the previous successful response and timestamp. The browser validates both the response envelope and resource-specific normalized payload before accepting data into the Query cache. Invalid data is treated as an error. Initial failures show no numeric values.

Errors offer both a retry button and “Neu anmelden / Seite neu laden”, which reloads the current dashboard document so Cloudflare Access can initiate sign-in when needed. Fetch redirects remain blocked. Browsers cannot reliably distinguish a rejected login redirect from an ordinary network failure, so those failures show a neutral connection message rather than claiming that the session expired. Direct 401/403 responses identify denied access. Tests mock responses and the navigation API; they do not verify a deployed Access sign-in flow. Test fixtures are never used by the application.

Run `npm run pages:dev` to exercise the full integration locally. For Vite hot reload, keep Pages running on port 8788 and run `npm run dev` in another terminal. Tests cover adapters, route errors, UI states, shared queries and background polling. API reference: [mempool.space REST API](https://mempool.space/docs/api/rest); polling behavior: [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/polling).

## Design system

Bitcoin Analytical follows the approved final Observatory prototype, palette B. Dark is the default regardless of OS preference. A manual toggle persists the theme in local storage; storage failure does not prevent toggling. An early inline script avoids theme flash, and the provider applies the current theme before chart effects read CSS tokens.

| Token       | Dark      | Light     |
| ----------- | --------- | --------- |
| Background  | `#111214` | `#F3F4F5` |
| Cards       | `#191B1E` | `#FFFFFF` |
| Borders     | `#373B42` | `#D2D7DE` |
| Interaction | `#F7931A` | `#9A4B00` |
| Data        | `#9AB9DE` | `#355F8C` |

1536px maximum container width, the existing 12-column content grid, 8px panel radius and 16–20px grid gaps. Manrope carries the interface; Inter carries technical labels, metadata and tables. Metrics use tabular digits. All four navigation targets remain visible on mobile, including the full “Netzwerk & Mining” label. Route changes update the document title and focus the page heading. No glass effects or chart animations. ECharts is lazy-loaded with selective imports; charts resize and dispose on unmount and theme change.

See [Phase 2.2: design system and app shell](docs/phase-2.2-design-system-app-shell.md) for all semantic tokens, local font licenses, responsive behavior, actual browser screenshots, prototype deviations and validation results. Content components retain their current composition for Phase 2.3. Code review and visual owner approval remain pending.

## Cloudflare and external access boundary

For Pages builds, use `.nvmrc` to select Node.js 22.22.2 and its bundled npm 10.9.7. Set the build command to `npm run build` and the output directory to `dist`. Pages v3 does not select Node or npm from `package.json`'s `engines`; those entries describe the supported toolchain. Remove any existing `NPM_VERSION=11.20.0` override or global npm installation from the Pages build settings, and remove a conflicting `NODE_VERSION` override or set it to `22.22.2`. Check both production and preview settings. A `Cannot find module 'promise-retry'` error during npm initialization indicates an incomplete npm installation; adding it to application dependencies cannot repair that bootstrap failure. If a previous broken npm installation persists, clear the Pages build cache before the next authorized build.

References: [Node.js 22.22.2 bundled npm](https://nodejs.org/en/download/archive/v22.22.2), [Pages build image and version selection](https://developers.cloudflare.com/pages/configuration/build-image/).

`wrangler.jsonc` declares `dist` as build output. File-based Functions expose `GET /api/health`; unknown `/api/*` endpoints return JSON 404. `_routes.json` invokes Functions only for `/api/*`. Pages' built-in SPA fallback supports deep links; do not add a top-level `404.html` unless replacing that behavior intentionally.

The reported production hostnames are **bitcoin.falkner.info** and **bitcoin-dashboard-erm.pages.dev**. Cloudflare Access has been set up externally; its actual configuration is not verified by this repository. Follow the [manual Access verification](docs/cloudflare-pages-verification.md#manual-external-access-verification-separate-release-gate) for both production addresses, deployment hashes and branch aliases. Anonymous requests must return no protected HTML, static assets or API responses; a login redirect is acceptable. The Pages preview protection option alone does not establish protection for either production hostname.

Secrets belong in Cloudflare bindings or ignored `.dev.vars`, never `VITE_*` values or tracked source. Bitcoin requests use only public mainnet data and require no provider secret or private node. New endpoints stay under the existing `/api/*` routing and hostname-level Access boundary, add no CORS permission or bypass route, and do not change Access configuration. Access enforcement remains the responsibility of the existing Cloudflare application; local tests cannot verify deployed hostname policies. The unauthenticated HTML/API checks above still apply to every production and preview hostname. Package scripts intentionally contain no deployment command.

Setup references: [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite), [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).
