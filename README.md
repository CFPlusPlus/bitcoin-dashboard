# Bitcoin Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](#tech-stack)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](#tech-stack)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](#deployment)
[![OpenNext](https://img.shields.io/badge/OpenNext-Cloudflare-black)](#deployment)

Bitcoin Dashboard is a Bitcoin-only web app built with Next.js, React, and TypeScript. It runs on Cloudflare Workers via OpenNext and combines market data, charting, network metrics, sentiment, on-chain activity, and a focused tools area in one localized product.

## Current Product

The current product includes:

- localized page routes for German (`de`) and English (`en`)
- a homepage dashboard with price, market structure, performance, chart, sentiment, network, halving, and on-chain sections
- a dedicated tools area with a DCA calculator
- user-selectable quote currencies with persisted local preference
- auto-refresh for dashboard sections plus manual refresh controls
- internal `/api/*` route handlers as the only UI-facing backend boundary
- SEO metadata, Open Graph images, X images, and JSON-LD structured data
- Cloudflare Workers deployment via OpenNext
- Cloudflare KV backed CoinGecko cache fallback and Wrangler observability

## Product Areas

### Dashboard

The localized dashboard currently surfaces:

- BTC spot price and 24h change
- market cap, market cap rank, volume, dominance, supply metrics, 24h high and low
- ATH and ATL distance context
- performance windows for `7d`, `30d`, `90d`, `1y`, and `YTD`
- 52-week high and low, 200-day moving average, and volatility context
- price chart views for `1d`, `7d`, and `30d`
- 30-day market-context charts for market cap and volume
- Fear & Greed index with 7-day context and next update timing
- latest block height, fee recommendations, mempool backlog, recent blocks, hashrate, and difficulty data
- halving countdown and reward context
- on-chain activity metrics from Coin Metrics
- a tools preview section on the homepage

### Tools

The tools area currently includes:

- an overview page for the available Bitcoin tools
- a DCA calculator for logging purchases, tracking average buy price, and comparing against the current market price
- local persistence for stored DCA entries on the current device

### Supporting Pages

The app also ships:

- localized legal placeholder pages for imprint and privacy
- localized social image routes for the home page, tools page, and DCA page

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- React Query for client-side query orchestration

### Server And Runtime

- Next.js Route Handlers
- OpenNext for Cloudflare
- Cloudflare Workers
- Wrangler 4

### Cloudflare Products In Use

- Workers for the runtime target
- Workers KV for CoinGecko cache fallback via `BITCOIN_DASHBOARD_CACHE`
- Wrangler observability for runtime visibility

### Testing And Tooling

- ESLint
- Prettier
- Vitest
- Testing Library
- MSW

### Data Providers

- CoinGecko for market, chart, and performance data
- mempool.space for network and fee data
- Alternative.me for Fear & Greed sentiment
- Coin Metrics Community API for on-chain activity

## Routing And Localization

User-facing pages are localized under `/{locale}`.

Current public routes:

- `/` redirects to `/de`
- `/de` and `/en` render the dashboard
- `/de/tools` and `/en/tools` render the tools overview
- `/de/tools/dca-rechner` and `/en/tools/dca-rechner` render the DCA calculator
- `/de/impressum` and `/en/impressum` render the localized imprint placeholder
- `/de/datenschutz` and `/en/datenschutz` render the localized privacy placeholder

Unlocalized convenience routes such as `/tools` and `/tools/dca-rechner` redirect to the default locale. Internal API routes remain unlocalized under `/api/*`.

## Internal API Surface

The dashboard UI currently consumes these internal endpoints:

- `/api/overview`
- `/api/chart`
- `/api/performance`
- `/api/market-context-chart`
- `/api/network`
- `/api/onchain-activity`
- `/api/sentiment`

These routes normalize provider payloads into app-level contracts before any data reaches the UI.

## Architecture Summary

This repository is a single Next.js codebase with a deliberate server boundary:

- `src/app` owns routes, layouts, metadata, and route handlers
- `src/views` owns page-level composition
- `src/components` owns reusable UI building blocks
- `src/hooks` owns client orchestration and browser persistence
- `src/domain/dashboard` owns DTOs and mapping logic for dashboard data
- `src/server` owns runtime helpers, cache helpers, and provider integrations
- `src/types` re-exports the normalized app contracts used by the UI

For cross-cutting guidance, read the documents under `docs/`.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- a CoinGecko demo API key

### Installation

```bash
npm install
```

### Local Environment

Create a `.dev.vars` file in the project root:

```bash
COINGECKO_DEMO_API_KEY="your_demo_key"
```

Notes:

- `.dev.vars` is used for local server/runtime environment values
- `COINGECKO_DEMO_API_KEY` is required for the CoinGecko-backed routes
- `BITCOIN_DASHBOARD_CACHE` is configured in `wrangler.jsonc` for deployed Workers and is optional for local development
- optional site URL environment values such as `NEXT_PUBLIC_SITE_URL` or `SITE_URL` can be used to control canonical metadata generation

## Development Commands

Run from the repository root:

```bash
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run build
npm run cf:build
npm run cf:preview
npm run cf:typegen
npm run deploy
```

Command notes:

- `npm run dev`: standard local development entry point
- `npm run cf:build`: builds the OpenNext Cloudflare bundle
- `npm run cf:preview`: previews an existing OpenNext build locally
- `npm run cf:dev`: runs `cf:build` followed by `cf:preview`
- `npm run preview`: alias for `npm run cf:dev`
- `npm run deploy`: builds and deploys the Worker via OpenNext

## Deployment

This project targets Cloudflare Workers through OpenNext.

Current deployment configuration:

- `open-next.config.ts` uses the OpenNext Cloudflare adapter
- `next.config.ts` initializes the OpenNext Cloudflare dev runtime
- `wrangler.jsonc` points to `.open-next/worker.js`
- static assets are served from `.open-next/assets`
- `nodejs_compat` is enabled in Wrangler
- `BITCOIN_DASHBOARD_CACHE` is bound as a KV namespace in Wrangler
- Wrangler observability is enabled

Typical deployment flow:

```bash
npm run deploy
```

Or explicitly:

```bash
npm run cf:build
npx opennextjs-cloudflare deploy
```

Legacy Cloudflare Pages workflows do not apply to this repository.

## Windows Note

Native Windows works well for day-to-day work with `npm run dev`. Cloudflare preview flows can be less reliable than in WSL, so `npm run cf:preview` and `npm run cf:dev` are best treated as parity checks rather than the default inner loop on Windows.

## Next.js Compatibility Note

`next` is intentionally pinned to `16.1.6` because `@opennextjs/cloudflare@1.17.1` is currently not compatible with `next@16.2.0` during Cloudflare Worker startup.

## Project Structure

```text
bitcoin-dashboard/
|-- docs/
|-- public/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   `-- [locale]/
|   |-- components/
|   |-- data/
|   |-- domain/
|   |-- hooks/
|   |-- i18n/
|   |-- lib/
|   |-- server/
|   |-- styles/
|   |-- types/
|   `-- views/
|-- middleware.ts
|-- next.config.ts
|-- open-next.config.ts
|-- package.json
`-- wrangler.jsonc
```

## Documentation Map

Key project docs:

- `docs/ARCHITECTURE.md`
- `docs/API_STRATEGY.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/INFORMATION-ARCHITECTURE.md`
- `docs/ASYNC-STATE-PATTERN.md`
- `docs/STYLING-CONVENTIONS.md`
- `docs/UI-PRINCIPLES.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/ROADMAP.md`

