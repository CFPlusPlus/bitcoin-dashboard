# Bitcoin Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](#tech-stack)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](#tech-stack)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](#deployment)
[![Status](https://img.shields.io/badge/status-beta-orange)](#project-status)

A lightweight Bitcoin dashboard built with Next.js, React and TypeScript, deployed to Cloudflare Workers via OpenNext.

## Project Status

The app currently includes:

- Dashboard home page for market, network and sentiment overview
- Dedicated tools area for interactive Bitcoin utilities
- BTC price in USD and EUR
- 24h change
- 24h volume
- Market cap
- 24h high / low
- Price chart for 1D / 7D / 30D
- Latest block height
- Recommended network fees
- Fear & Greed Index
- Fully working DCA calculator with local persistence
- Auto-refresh every 60 seconds
- Manual refresh button
- Persisted dashboard preferences on the current device

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript

### Server Runtime

- Next.js Route Handlers
- Cloudflare Workers
- OpenNext for Cloudflare

### Data Providers

- CoinGecko for market and chart data
- mempool.space for Bitcoin network data
- Alternative.me for Fear & Greed

## Architecture

This project is a single-repo full-stack Next.js app:

- UI routes live in `src/app`
- shared interactive UI lives in `src/views`, `src/components`, `src/hooks` and `src/lib`
- API endpoints live in `src/app/api/*/route.ts`
- provider access and server helpers live in `src/server`
- Cloudflare Worker output is generated into `.open-next/`

## Routes

- `/` - dashboard home
- `/tools` - tool overview
- `/tools/dca-rechner` - DCA calculator tool page
- `/api/overview` - market overview proxy
- `/api/chart` - chart proxy
- `/api/network` - network proxy
- `/api/sentiment` - sentiment proxy

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
npm install
```

### Local environment variables

Create a `.dev.vars` file in the project root:

```bash
COINGECKO_DEMO_API_KEY="your_demo_key"
```

Important:

- do not commit `.dev.vars`
- set the same variable in your Cloudflare Worker environment for production

## Development

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run cf:dev
```

Builds the OpenNext Cloudflare bundle and starts the local Cloudflare preview.

```bash
npm run cf:build
```

Builds the OpenNext Cloudflare Worker bundle only.

```bash
npm run cf:preview
```

Starts the local Cloudflare preview from an existing OpenNext build.

```bash
npm run build
```

Builds the Next.js production app.

`npm run preview` does the same as `npm run cf:dev`.

### Windows note

OpenNext currently warns that native Windows is not fully reliable for local preview.

In practice this means:

- `npm run dev` is the best default command for day-to-day local development on Windows
- `npm run cf:dev` and `npm run cf:preview` are better run in WSL when you want Cloudflare parity
- rerunning OpenNext preview on native Windows can also hit `.open-next` file-lock errors

```bash
npm run deploy
```

Builds and deploys the OpenNext bundle to Cloudflare Workers.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run test
```

Runs the Vitest test suite once.

```bash
npm run cf:typegen
```

Generates Cloudflare environment typings.

## Deployment

This project targets Cloudflare Workers with OpenNext.

Typical flow:

```bash
npm run build
npx opennextjs-cloudflare build
wrangler deploy
```

Important:

- `npx wrangler pages dev dist` is from the old Vite + Cloudflare Pages setup and no longer applies
- this project now runs as a Cloudflare Worker via OpenNext, not as a Pages app with `functions/`

## Project Structure

```text
bitcoin-dashboard/
|-- public/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |   |-- chart/
|   |   |   |-- network/
|   |   |   |-- overview/
|   |   |   `-- sentiment/
|   |   |-- tools/
|   |   |   `-- dca-rechner/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |-- data/
|   |-- hooks/
|   |-- lib/
|   |-- server/
|   |-- types/
|   `-- views/
|-- next.config.ts
|-- open-next.config.ts
|-- package.json
|-- tsconfig.json
`-- wrangler.jsonc
```
