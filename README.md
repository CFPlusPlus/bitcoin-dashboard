# Bitcoin Dashboard

A private-use Bitcoin analytics dashboard in a public source repository. Initial scaffold only: no live data, production deployment or authentication configuration.

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
src/lib/              Query client, synthetic fixture and utilities
src/test/             Behavior and API contract tests
functions/api/        Cloudflare Pages Functions
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

UI content is German; code and documentation are English. Every metric is an em dash with a pending-data label. The chart uses an explicitly labeled synthetic index, never fabricated Bitcoin prices. TanStack Query manages this local demo fixture to establish the provider/query boundary. No external data requests are made. Analytics and calculator are placeholders, not inactive controls disguised as working features.

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

Secrets belong in Cloudflare bindings or ignored `.dev.vars`, never `VITE_*` values or tracked source. Provider proxies, input validation, caching and failure handling follow when real data is connected. Package scripts intentionally contain no deployment command.

Setup references: [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite), [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).
