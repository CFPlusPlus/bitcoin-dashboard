# Architecture

## Purpose

This document describes the current architecture of the Bitcoin Dashboard codebase. It is the source of truth for where responsibilities live today and which boundaries must stay intact as the project evolves.

The app is already structured around a stable V1 shape:

- localized App Router pages
- internal `/api/*` route handlers as the app-facing backend
- server-side provider access and normalization
- reusable UI/view/hook layers on the client
- Cloudflare Workers deployment via OpenNext

## Runtime Model

The application is a Next.js App Router project deployed to Cloudflare Workers through OpenNext.

Current runtime pieces:

- `next.config.ts` initializes the OpenNext Cloudflare dev runtime
- `open-next.config.ts` uses the Cloudflare adapter
- `wrangler.jsonc` points Wrangler at `.open-next/worker.js` and `.open-next/assets`
- `src/server/env.ts` reads runtime bindings through `@opennextjs/cloudflare`
- Cloudflare KV is used for CoinGecko cache fallback when the binding is present

## Routing And Localization

Routing is locale-first.

Current behavior:

- localized page routes are served directly under `/{locale}` and are statically prerendered when possible
- `middleware.ts` is intentionally limited to unlocalized convenience routes such as `/` and `/tools`
- supported locales are defined in `src/i18n/config.ts`
- `/` and unlocalized convenience routes redirect to the preferred localized route
- the locale cookie is synchronized on the client after localized page navigation
- internal API routes remain unlocalized under `/api/*`

Route files stay thin and primarily do three things:

- validate route params
- define route metadata and structured data
- hand page composition off to `src/views`

Examples:

- `src/app/[locale]/page.tsx` renders the localized home route
- `src/app/[locale]/tools/page.tsx` renders the localized tools route
- `src/app/[locale]/tools/dca-rechner/page.tsx` renders the localized DCA route
- `src/app/page.tsx` only redirects to the default locale

## Rendering Model

The app uses a mixed server/client model.

Server-owned responsibilities:

- route params and locale validation
- metadata generation and JSON-LD output
- provider access
- runtime environment access
- response normalization and cache headers

Client-owned responsibilities:

- dashboard interaction and refresh behavior
- React Query orchestration for internal endpoints
- persisted user preferences such as currency, range, and auto-refresh
- document locale synchronization for statically served localized pages
- tool-local state such as DCA entries

Current examples:

- `src/views/HomePage.tsx` orchestrates the dashboard via `useDashboardData`
- `src/views/DcaCalculatorPage.tsx` manages local calculator state and persistence
- `src/components/AppProviders.tsx` sets up the shared React Query client

Dashboard orchestration note:

- `useDashboardData` now prefers bundled internal endpoints for the main homepage fetch cycle
- hidden tabs do not continue dashboard polling
- only one visible tab should drive automatic dashboard polling at a time

## Current Layering

### `src/app`

Owns:

- page routes
- layouts
- metadata entry points
- route handlers
- redirect-only compatibility routes

Rules:

- keep route files thin
- prefer `src/views` for page composition
- keep shared logic out of the route tree

### `src/app/api`

Owns the app-facing backend boundary.

Current endpoints:

- overview
- chart
- performance
- market-context-chart
- network
- onchain-activity
- sentiment
- dashboard-core
- dashboard-slow

Rules:

- parse request input
- call providers on the server only
- normalize every response into app contracts
- set cache headers explicitly per route
- return user-safe errors

### `src/domain/dashboard`

Owns dashboard DTOs and mapping logic.

This layer currently holds:

- DTO definitions used by the app
- route-facing mapping helpers for overview, chart, network, sentiment, performance, and on-chain data
- the normalization boundary between raw provider payloads and app-facing contracts

Rules:

- keep provider schemas out of the UI
- map raw payloads here or directly beside the route when logic is still very small
- expose stable app contracts rather than upstream shapes

### `src/server`

Owns runtime-specific and provider-facing code.

Current responsibilities:

- Cloudflare env access
- cache policy helpers
- KV fallback helpers
- shared upstream request helpers
- provider clients under `src/server/providers`
- upstream error modeling

Rules:

- secrets and runtime bindings stay here
- provider access stays here or in route handlers that call into this layer
- browser-only logic must not be imported here

### `src/views`

Owns page-level composition.

Current examples:

- `HomePage.tsx`
- `ToolsPage.tsx`
- `DcaCalculatorPage.tsx`
- `views/dashboard/*` section composition

Rules:

- views coordinate hooks and components
- views consume normalized internal contracts
- views do not call upstream providers directly

### `src/components`

Owns reusable presentation building blocks.

Current responsibilities:

- cards, sections, layout primitives, and display components
- dashboard/chart/status primitives
- site shell pieces such as navigation and footer
- shared async-state UI

Rules:

- components stay presentation-focused
- components do not know provider URLs or raw upstream fields

### `src/hooks`

Owns reusable client orchestration.

Current examples:

- `useDashboardData`
- `usePersistentState`

Rules:

- hooks may call internal `/api/*` endpoints
- hooks must not bypass the server boundary
- persisted state must stay local and non-sensitive

### `src/lib`

Owns pure helpers and framework-light utilities.

Current responsibilities:

- formatting
- client-side fetch helpers
- async-state resolution
- SEO helpers
- DCA calculations
- currency helpers

Rules:

- prefer pure functions here
- move runtime-specific code to `src/server`

### `src/types`

Owns the UI-facing normalized type surface.

Current pattern:

- `src/types/dashboard.ts` re-exports DTO-backed contracts from `src/domain/dashboard/dto`
- DCA-specific local types live alongside those exports

Rules:

- UI code consumes app types from here
- raw provider schemas do not belong here

## Data Flow

The current data flow is:

1. A client view or hook requests an internal `/api/*` endpoint.
2. The route handler validates input and calls the relevant provider helpers.
3. Provider payloads are validated and mapped into DTOs.
4. The route handler returns a normalized app response with cache metadata, timestamps, and warnings where needed.
5. The UI renders the normalized contract through views and presentation components.

Concrete dashboard example:

1. `useDashboardData` requests `/api/dashboard-core` and `/api/dashboard-slow` for the homepage refresh cycle.
2. Those bundle routes compose the existing route handlers for overview, chart, network, sentiment, on-chain, performance, and market-context data.
3. Route handlers call CoinGecko, mempool.space, Alternative.me, or Coin Metrics on the server.
4. Mappers in `src/domain/dashboard` convert upstream payloads into app DTOs.
5. Dashboard sections render those DTOs and derive UI state via `resolveAsyncDataState`.

## Current Cross-Cutting Patterns

### Caching

Caching is expressed at the route-handler boundary.

Current implementation uses:

- route-level `Cache-Control` headers
- Next.js revalidation hints for upstream fetches
- Cloudflare KV for CoinGecko-backed stale fallback
- explicit cache metadata returned in CoinGecko-backed DTOs

### Errors And Partial Data

The app prefers predictable app-level behavior over raw upstream failures.

Current behavior includes:

- normalized error responses from route handlers
- warnings arrays on partial or degraded payloads
- stale-cache warnings when KV fallback data is served
- shared upstream error handling in `src/server/upstream.ts`

### Metadata And SEO

Metadata is part of the route layer.

Current implementation includes:

- localized metadata generation in route files
- Open Graph and X image routes
- JSON-LD output for website, webpage, collection, and software application schemas

## Architecture Rules

These rules are mandatory for this repository:

1. External providers are called only from server code.
2. UI code consumes internal `/api/*` endpoints, never provider URLs.
3. Route handlers return normalized app contracts, not raw upstream payloads.
4. Locale-prefixed routing remains the rule for page routes.
5. Route files stay thin and delegate composition to `src/views`.
6. Shared domain contracts and mapping logic stay centralized.
7. Runtime env access stays in `src/server/env.ts`.
8. Local persistence is allowed only for explicitly local, non-sensitive UX state.
9. Cloudflare-specific runtime behavior must not leak through the UI layer.
10. New work should extend the nearest existing feature area before adding a new pattern.

## Adding New Work

### New dashboard domain

When adding another dashboard data area:

1. define or extend the DTO in `src/domain/dashboard/dto.ts`
2. add mapping logic in `src/domain/dashboard`
3. add or extend a route handler in `src/app/api`
4. use `src/server` for provider access and cache helpers
5. consume the new contract from a hook/view/component path

### New tool

When adding another tool:

1. add the localized route entry in `src/app/[locale]/tools/...`
2. keep page composition in `src/views`
3. keep reusable UI in `src/components`
4. keep pure calculations in `src/lib`
5. use local persistence only when the state is device-local and non-sensitive

## Decision Summary

The current architecture is a layered App Router application with one critical rule: provider-specific data enters through the server, gets normalized once, and the rest of the app works with app-owned contracts.
