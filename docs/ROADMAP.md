# Roadmap

## Purpose

This file tracks follow-up priorities from the current V1 product state. It is intentionally separate from `README.md` and the current-state docs, which describe what already exists today.

The current product already includes:

- localized dashboard and tools routes
- internal API routes for overview, chart, performance, market context, network, sentiment, and on-chain activity
- Cloudflare Workers deployment through OpenNext
- CoinGecko KV fallback caching
- SEO metadata, social images, and structured data
- a live tools area with the DCA calculator

## Current Priority Buckets

### 1. Documentation And Consistency

Focus:

- keep `README.md` and `docs/*` aligned with the implemented product
- reduce stale or duplicated setup guidance
- document Cloudflare runtime behavior where it materially affects contributors

### 2. Dashboard Polish

Focus:

- improve readability and hierarchy of the existing sections
- refine responsive behavior and scanability
- continue polishing async-state and refresh UX
- harden edge cases around degraded or stale data

### 3. Tools Quality

Focus:

- improve the current DCA calculator experience
- keep the tools area intentionally curated
- add another tool only when it clearly strengthens the existing Bitcoin-only product scope

### 4. Release Operations

Focus:

- improve deployment confidence on Cloudflare Workers
- document production checks and smoke tests
- tighten operational visibility around provider failures and runtime issues

## Work That Still Does Not Belong Here

The following remain out of scope unless the product docs change intentionally:

- portfolio tracking
- accounts or authentication
- alerts and automation
- multi-asset expansion
- admin or back-office systems
- trading-terminal style feature expansion

## How To Use This File

Use this roadmap as a lightweight follow-up backlog, not as the primary description of the product.

If there is ever a conflict:

- `README.md` and the architecture/product docs describe the current product
- this file only describes likely next priorities from that current state

