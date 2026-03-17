# Roadmap

## Purpose

This roadmap translates the current project direction into milestone-based implementation phases so future work can be prioritized deliberately instead of being added ad hoc.

The repository already has a working MVP baseline:

- dashboard and tools routes exist
- internal API routes are in place for overview, chart, network, and sentiment data
- Cloudflare Workers deployment is configured through OpenNext
- linting and Vitest are available
- the DCA calculator is implemented as the first complete tool

This document focuses on the path from that baseline to a cleaner, more complete V1 release.

## Planning principles

- Sequence work so architecture and quality guardrails are settled before UI expansion.
- Prefer finishing the existing dashboard and tools experience before adding new feature areas.
- Treat SEO, performance, and release hardening as distinct milestones rather than background chores.
- Use milestones as issue buckets so future GitHub Issues can map cleanly to a defined delivery phase.

## Milestone 1 - Foundation

### Objective

Stabilize the project foundation so future dashboard and tools work happens against consistent architecture, API, environment, and UX patterns.

### Scope

- align repository documentation so README, architecture, API strategy, and product scope describe the same implementation boundaries
- confirm that route handlers, shared types, and server helpers follow the intended normalization and error-handling rules
- tighten environment handling around local and Cloudflare runtime configuration
- establish a quality baseline for linting, tests, and minimum verification expectations for new work
- standardize loading, empty, partial, and error states across dashboard sections and tools
- identify small structural cleanup needed before more UI polish is added

### Dependencies

- current architecture and API strategy documents
- existing `src/server/env.ts`, `src/server/http.ts`, and route handlers
- current test and lint setup in `package.json`

### Example issue topics

- audit dashboard API routes for consistent normalized response contracts
- document required environment variables and local setup expectations in one place
- add shared UI patterns for loading, partial-data warnings, and retry/error presentation
- define minimum test coverage expectations for `src/lib` and route-level helpers
- extract repeated server-side response helpers if route logic starts to drift

### Out of scope

- adding new dashboard metrics or new provider domains
- broad visual redesign work
- advanced SEO or deployment hardening

## Milestone 2 - Dashboard Completion

### Objective

Turn the current dashboard into a cohesive, polished V1 homepage with clearer hierarchy, stronger KPI presentation, and better responsiveness.

### Scope

- refine the dashboard information architecture so market, chart, network, and sentiment sections feel intentionally ordered
- polish KPI cards for clarity, consistency, and quick scan value
- improve chart presentation, supporting states, and section-level context
- improve refresh UX for manual and auto-refresh behavior
- tighten responsive behavior for mobile and tablet layouts
- reduce visual rough edges that make the dashboard feel unfinished

### Dependencies

- Milestone 1 foundations for consistent state handling and architecture alignment
- existing dashboard view and components in `src/views/DashboardPage.tsx` and `src/components/*`
- current data contracts in `src/types/dashboard.ts`

### Example issue topics

- reorganize dashboard section order and headings for clearer scanning
- improve KPI card formatting, labels, and unavailable-data presentation
- polish chart legends, axis context, and loading/error states
- improve refresh controls, timestamp visibility, and stale-data feedback
- review mobile breakpoints and spacing for dashboard sections

### Out of scope

- adding portfolio features, accounts, or alerts
- expanding into non-Bitcoin assets
- building advanced charting or trading workflows

## Milestone 3 - Tools

### Objective

Make the tools area feel intentional and production-ready, starting with DCA calculator polish and a stronger foundation for future Bitcoin utilities.

### Scope

- improve the tools overview page so it explains current and future tool direction clearly
- polish the DCA calculator UX, output presentation, and persistence behavior
- clarify shared patterns for tool layouts, metadata, and calculation components
- prepare a clean structure for future calculators without prematurely building them
- keep the tools area aligned with the narrow V1 product scope

### Dependencies

- Milestone 1 quality and structural baseline
- existing tools route, data, and DCA logic in `src/app/tools`, `src/views/ToolsPage.tsx`, `src/views/DcaCalculatorPage.tsx`, `src\data/tools.ts`, and `src/lib/dca.ts`

### Example issue topics

- improve tools overview copy, layout, and affordances for the current catalog
- refine DCA form validation, empty states, and results readability
- standardize reusable tool page sections and metadata treatment
- separate calculator-specific logic from reusable tool scaffolding where helpful
- define the file structure and conventions for adding the next calculator cleanly

### Out of scope

- launching multiple new calculators in V1 without clear product need
- portfolio tracking, saved user accounts, or long-term holdings management
- tool sprawl that weakens the Bitcoin-only focus

## Milestone 4 - SEO and Performance

### Objective

Add the foundational discoverability and performance work needed for a public V1 launch without turning the product into a content or growth-heavy project.

### Scope

- define route-level metadata strategy for the dashboard and tools pages
- add social preview support for key public pages
- introduce structured data where it meaningfully helps page understanding
- review performance across dashboard data fetching, rendering, and asset usage
- review current caching choices against dashboard freshness and provider constraints
- identify low-risk performance wins before release

### Dependencies

- stable dashboard and tools page structure from Milestones 2 and 3
- current Next.js app routing and metadata entry points in `src/app`
- existing API caching strategy documented in `docs/API_STRATEGY.md`

### Example issue topics

- add page metadata for home, tools, and DCA routes
- define Open Graph and social preview assets/content
- add structured data for the public product pages if appropriate
- audit internal API cache headers against real dashboard usage patterns
- review chart rendering and client-side refresh behavior for avoidable overhead

### Out of scope

- blog/content marketing systems
- programmatic SEO expansion
- speculative optimization work without a concrete bottleneck

## Milestone 5 - Release Readiness

### Objective

Harden the project for a dependable V1 release on Cloudflare Workers with clear production checks, observability basics, and launch procedures.

### Scope

- review and harden the Cloudflare deployment path and runtime assumptions
- define a practical pre-release production checklist
- establish basic monitoring and logging expectations for provider failures and runtime issues
- verify environment configuration, deploy workflow, and fallback behavior in production-like conditions
- create a launch checklist that covers product, technical, and operational readiness

### Dependencies

- Milestones 1 through 4 completed to avoid hardening unstable product areas
- current OpenNext and Wrangler deployment setup
- stable route contracts and consistent error handling

### Example issue topics

- verify Cloudflare deploy steps, env configuration, and rollback expectations
- define production smoke checks for dashboard routes, API routes, and tools
- add basic logging guidance for upstream failures and unexpected server errors
- document post-deploy verification steps and ownership
- create a V1 launch checklist covering quality, performance, SEO, and operations

### Out of scope

- enterprise-grade observability stacks
- multi-environment release orchestration beyond what V1 needs
- operational processes for account systems or back-office tools that are outside product scope

## Release sequence summary

The intended order is:

1. Foundation
2. Dashboard Completion
3. Tools
4. SEO and Performance
5. Release Readiness

This order reflects the current repository state. The app already works, so the next priority is consistency and quality, then completion of the core user-facing experiences, then public-launch polish and production hardening.

## How to use this roadmap

- Create future GitHub Issues under the milestone they primarily advance.
- Avoid pulling work from later milestones forward unless it unblocks an earlier milestone.
- If a proposed feature does not strengthen the current dashboard, tools, public discoverability, or release stability, it likely does not belong in V1.
