# Bitcoin Dashboard

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)](#tech-stack)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)](#deployment)
[![Status](https://img.shields.io/badge/status-MVP-yellow)](#mvp-status)

A lightweight Bitcoin dashboard built with React, TypeScript and Vite, powered by Cloudflare Pages Functions.

## Preview

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
- React
- React Router
- TypeScript
- Vite

### Serverless API
- Cloudflare Pages Functions

### Data Providers
- CoinGecko for market and chart data
- mempool.space for Bitcoin network data
- Alternative.me for Fear & Greed

## Architecture

This project is designed as a single-repo full-stack Pages app:

- the frontend is served as static assets via Cloudflare Pages
- the backend layer is implemented through Cloudflare Pages Functions
- external APIs are called server-side through the Functions layer
- the UI is split into dashboard pages and dedicated tool pages
- no traditional database is required for the current MVP

## Routes

- `/` - dashboard home
- `/tools` - tool overview
- `/tools/dca-rechner` - DCA calculator tool page

## Features

### Dashboard
- Current BTC price
- 24h change
- 24h volume
- Market cap
- 24h high / low
- Latest Bitcoin block height
- Recommended fees
- Fear & Greed Index
- 1D / 7D / 30D chart
- USD / EUR support

### Tools Area
- Dedicated space for future calculators and utilities
- DCA calculator with separate USD and EUR entry histories
- Average buy price, invested capital, BTC amount and PnL overview
- Current market-price comparison based on live overview data

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
- set the same variable later in Cloudflare Pages for production

### Run locally

For local development with Cloudflare Pages Functions:

```bash
npm run build
npx wrangler pages dev dist
```

You can also use the predefined script:

```bash
npm run cf:dev
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite frontend in development mode.

```bash
npm run build
```

Builds the production bundle.

```bash
npm run preview
```

Serves the Vite production build locally.

```bash
npm run cf:dev
```

Builds the app and starts it locally with Cloudflare Pages / Wrangler.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run test
```

Runs the Vitest test suite once.

## Project Structure

```text
bitcoin-dashboard/
|-- functions/
|   |-- api/
|   |   |-- chart.ts
|   |   |-- network.ts
|   |   |-- overview.ts
|   |   `-- sentiment.ts
|   `-- lib/
|       `-- http.ts
|-- src/
|   |-- components/
|   |-- data/
|   |-- hooks/
|   |-- lib/
|   |-- pages/
|   |-- types/
|   |-- App.tsx
|   `-- main.tsx
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
`-- wrangler.jsonc
```
