# Architecture

## Purpose

This document is the source of truth for how the Bitcoin Dashboard should be structured as the codebase grows. It explains the current application shape, the intended responsibilities of each source area, and the architectural boundaries future work should follow.

The goal is not to freeze implementation details. The goal is to keep the project understandable, consistent, and easy to extend without mixing provider concerns, route logic, and UI code.

## High-level architecture

The application is a Next.js App Router project deployed to Cloudflare Workers through OpenNext.

At a high level:

1. `src/app` defines routes, page entry points, layouts, and HTTP route handlers.
2. `src/app/api` exposes application-facing JSON endpoints for the UI.
3. Route handlers call external providers on the server, validate and normalize their responses, and return the app's internal response shapes.
4. Client UI code consumes those internal API responses through shared types and helper functions.
5. Shared presentation, view composition, hooks, utilities, and types live in dedicated folders outside the route tree.

This creates a deliberate separation:

- Next.js handles routing, rendering, and route execution.
- Route handlers are the boundary between external services and the app.
- Shared domain types define the data contract used across server and UI code.
- Views and components render normalized app data instead of provider-specific payloads.

## Deployment model

The production target is Cloudflare Workers.

- `open-next.config.ts` configures the OpenNext Cloudflare adapter.
- `wrangler.jsonc` points Wrangler at the generated worker entry (`.open-next/worker.js`) and static assets.
- `src/server/env.ts` reads runtime environment values through `@opennextjs/cloudflare`.

OpenNext is responsible for adapting the Next.js App Router application to the Cloudflare runtime. That means application code should be written against Next.js route and rendering patterns, while deployment-specific runtime access stays isolated in `src/server`.

## Rendering model

The app uses a mixed server/client rendering model supported by the App Router.

- Route files in `src/app` remain the routing and composition entry points.
- Client interactivity is opt-in through `"use client"` modules such as dashboard and tool views.
- Server-only responsibilities include external provider access, runtime environment access, request validation, normalization, and API response shaping.
- Client-side responsibilities include interactive controls, local refresh behavior, view state, and browser persistence when the feature is explicitly user-local.

Current examples:

- `src/app/page.tsx` is a route entry point that renders the dashboard view.
- `src/views/DashboardPage.tsx` is a client view that manages dashboard interactivity through `useDashboardData`.
- `src/views/DcaCalculatorPage.tsx` is a client view that uses browser persistence for personal calculator entries.

## Source tree responsibilities

### `src/app`

Owns the route tree for the Next.js App Router.

Responsibilities:

- page entry points
- layouts
- route-level metadata and route-specific composition
- colocated route handlers under `api`

Rules:

- Keep route files thin.
- Prefer route files that delegate substantial UI to `src/views`.
- Do not put shared business logic in route files.

### `src/app/api`

Owns internal HTTP endpoints consumed by the application UI.

Responsibilities:

- request parsing and validation
- provider orchestration
- response normalization
- cache header decisions
- application-friendly error responses

Rules:

- Treat route handlers as the app-facing backend boundary.
- Return normalized app contracts, not raw provider payloads.
- Keep provider-specific parsing close to the route or extract it into server-focused modules when it grows.
- Do not move browser UI logic into route handlers.

### `src/components`

Owns reusable presentation components.

Responsibilities:

- rendering card, section, navigation, toolbar, chart, and display building blocks
- accepting already-prepared data via props
- encapsulating reusable UI patterns

Rules:

- Components should be presentation-focused.
- Avoid embedding provider fetch logic in shared components.
- Avoid making components responsible for page orchestration when that belongs in a view.

### `src/views`

Owns page-level view composition.

Responsibilities:

- assembling sections into a coherent page
- connecting hooks to presentational components
- handling page-local UI flow and interaction state

Rules:

- A view can coordinate multiple components and hooks.
- A view should not directly call external providers.
- If a page grows complex, the view is the preferred place for page-specific coordination before creating more folders.

### `src/hooks`

Owns reusable React hooks.

Responsibilities:

- UI data loading from internal endpoints
- browser state synchronization
- local persistence
- reusable interaction logic

Current examples:

- `useDashboardData` coordinates calls to `/api/overview`, `/api/network`, `/api/sentiment`, and `/api/chart`.
- `usePersistentState` wraps browser storage behind a typed React hook.

Rules:

- Hooks may call internal app endpoints.
- Hooks must not bypass the route-handler boundary to call providers directly from the browser.
- Shared hooks should expose app-level concepts, not provider response formats.

### `src/lib`

Owns shared framework-agnostic helpers and app utilities.

Responsibilities:

- internal API client helpers
- formatting helpers
- pure calculations
- testable utility logic

Current examples:

- `api.ts` standardizes client-side fetch handling for internal JSON endpoints.
- `dca.ts` contains pure DCA calculation logic.
- `format.ts` owns display formatting helpers.

Rules:

- Prefer pure functions here when possible.
- Keep React component code and Cloudflare runtime access out of this folder.
- If a utility becomes server-runtime-specific, move it to `src/server`.

### `src/server`

Owns server/runtime-specific code.

Responsibilities:

- runtime environment access
- HTTP helper utilities for route handlers
- provider-facing request helpers
- server-only abstractions

Current examples:

- `env.ts` reads Cloudflare runtime environment.
- `http.ts` provides timeout handling and consistent JSON/error responses.

Rules:

- This folder is the home for code that depends on server execution or deployment runtime behavior.
- External provider integration helpers should live here once they are shared across multiple routes.
- Do not import browser-only logic into server modules.

### `src/types`

Owns shared domain and API contract types.

Responsibilities:

- normalized data contracts
- reusable domain primitives
- shared UI/server typing for internal payloads

Current example:

- `dashboard.ts` defines the normalized contracts for overview, network, sentiment, chart, and DCA features.

Rules:

- Shared types should describe the app's internal model, not the raw provider schema.
- Reuse central types instead of redefining the same contract in multiple routes or components.

## Data flow

The intended data flow is:

1. An external provider is called from server-side route code.
2. The route handler validates, parses, and normalizes the provider response.
3. The route handler returns an internal JSON shape defined by shared app types.
4. A hook or page-level client module fetches that internal endpoint.
5. Views and components render the normalized data.

For the dashboard, the concrete path is:

1. `src/app/api/overview/route.ts`, `network/route.ts`, `sentiment/route.ts`, and `chart/route.ts` call CoinGecko, mempool.space, and Alternative.me on the server.
2. Those handlers convert provider responses into the app's own shapes, including warnings, partial-state flags, cache headers, and timestamps.
3. `src/hooks/useDashboardData.ts` fetches the internal `/api/*` endpoints through `src/lib/api.ts`.
4. `src/views/DashboardPage.tsx` coordinates the hook output.
5. `src/components/*` render the resulting UI.

Required architectural stance:

- External APIs are accessed server-side.
- Route handlers act as application-facing endpoints.
- UI code consumes normalized internal responses.
- Provider-specific response formats must not leak into views or shared components.

## Separation of concerns

### Provider fetch logic

Provider access belongs in server-side code, currently inside route handlers with shared request helpers from `src/server/http.ts`.

When a provider integration grows beyond a small route, extract server-only helpers under `src/server` rather than duplicating fetch and parsing code across routes.

### Data mapping and normalization

Normalization happens at the server boundary before data reaches the UI.

This includes:

- converting provider payloads into app field names
- handling partial failures
- converting invalid or missing provider values to safe app-level nulls or warnings
- shaping metadata like `source`, `fetchedAt`, `partial`, and `warnings`

### Domain typing

Shared domain and response contracts belong in `src/types`.

Types should be stable enough that UI code can depend on them without knowing or caring which provider supplied the data.

### Presentation components

Presentation components belong in `src/components`.

They should receive data through props and stay focused on rendering, layout, and display interactions rather than source-specific business logic.

### Page composition

Page composition belongs in `src/views` and thin route entries under `src/app`.

A page view can orchestrate multiple sections, hooks, and local state, but it should still consume internal app contracts instead of raw provider payloads.

## Rendering strategy

### What should stay server-driven

The following should remain server-driven by default:

- external provider access
- request validation and normalization
- environment-variable access
- response caching decisions
- any logic that depends on secret values or runtime-only capabilities

If a feature can be expressed as route-driven data plus rendered output, prefer that model first.

### What can be client-interactive

Client interactivity is appropriate for:

- dashboard controls like currency and chart range switching
- refresh triggers and auto-refresh timers
- form state and local calculations
- UI-only state such as tabs, toggles, and temporary filters

Client code can fetch internal `/api` endpoints, but it should not fetch providers directly.

### Where local persistence is acceptable

Local browser persistence is acceptable when the state is:

- user-local
- non-sensitive
- not required for shared server truth
- clearly tied to convenience or personalization

Current acceptable examples:

- remembered dashboard currency, range, and auto-refresh settings
- DCA calculator entries stored locally per device

Local persistence should not become a substitute for domain data ownership. Shared market data, provider responses, and app-wide contracts should still come from server-owned flows.

## Architecture rules

These rules are mandatory unless this document is intentionally updated.

1. No direct provider calls from arbitrary client components, hooks, or views.
2. All external API access must enter through server-side route or server modules.
3. Route handlers must return normalized application responses, not raw provider payloads.
4. Do not duplicate provider fetch logic across multiple routes; extract shared server helpers when reuse appears.
5. Shared types must be defined centrally and reused across route, hook, and UI code.
6. Presentation components should render prepared data, not own provider parsing or fetch orchestration.
7. Route files in `src/app` should stay thin and delegate page composition to `src/views`.
8. Feature code should remain cohesive; add to the nearest existing feature area before creating scattered one-off utilities.
9. Browser persistence is allowed only for explicitly local, non-sensitive UX state.
10. Cloudflare- or OpenNext-specific runtime access should stay isolated to server/runtime modules rather than leaking through the UI layer.

## Adding new domains

When adding a new dashboard domain such as another Bitcoin metric or insight area:

1. Define or extend normalized app types in `src/types`.
2. Add or extend a route handler under `src/app/api` for the server-facing integration.
3. Put shared provider/runtime helpers in `src/server` if the route logic is no longer small.
4. Fetch the new internal endpoint from a hook or page-level client module.
5. Render the result through `src/views` and `src/components`.

A new domain should be considered complete only when its provider boundary, normalized contract, and UI consumption path are all clear.

## Adding new tools and pages

New tools and pages should fit the existing route-plus-view structure.

- Add the route entry under `src/app`.
- Put substantial page composition in `src/views`.
- Put reusable UI sections in `src/components`.
- Put pure calculators and display helpers in `src/lib`.
- Use `src/hooks` for local persistence or internal endpoint orchestration.

For interactive tools:

- keep user-entered state local to the tool unless a shared server-backed model is explicitly introduced later
- reuse central types if the tool exposes domain concepts used elsewhere
- avoid placing tool-specific business logic directly in the route file

## Decision summary

The intended architecture is a layered App Router application:

- `src/app` owns routes.
- `src/app/api` owns app-facing server endpoints.
- `src/server` owns runtime and provider-facing server logic.
- `src/types` owns internal contracts.
- `src/hooks` and `src/lib` own reusable client and pure logic.
- `src/views` composes pages.
- `src/components` renders reusable UI.

The most important boundary is this one: provider-specific data comes in through the server, gets normalized once, and the rest of the app works with the app's own types and responses.
