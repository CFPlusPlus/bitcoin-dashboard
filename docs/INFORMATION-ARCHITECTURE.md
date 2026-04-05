# Information Architecture

## Purpose

This document describes the current content hierarchy and route structure of the shipped V1 product. It focuses on what exists today rather than proposing a future layout.

## Top-Level Navigation

The current primary navigation now lives in a persistent app sidebar instead of a top navbar.

The sidebar currently groups navigation into:

- dashboard sections (`overview`, `performance`, `market`, `cycle`, `network`, `on-chain`, `sources`)
- tools
- support links (`/impressum`, `/datenschutz`)

On smaller screens, the same navigation is available through a compact mobile drawer.

## Route Structure

Public page routes are locale-prefixed.

Current route map:

- `/` -> redirects to `/${DEFAULT_LOCALE}`
- `/{locale}` -> dashboard homepage
- `/{locale}/tools` -> tools overview
- `/{locale}/tools/dca-rechner` -> DCA calculator
- `/{locale}/impressum` -> legal placeholder page
- `/{locale}/datenschutz` -> legal placeholder page

Unlocalized helper routes such as `/tools` and `/tools/dca-rechner` redirect to the default locale.

Internal data routes stay separate under `/api/*` and are not part of the public IA.

## Current Homepage Hierarchy

The homepage is no longer presented as one long stacked dashboard.

Current behavior:

1. the localized route renders inside the shared sidebar shell
2. the left sidebar chooses the active dashboard section
3. the main panel renders one focused workspace at a time
4. the overview panel contains the homepage intro, refresh controls, overview metrics, the main BTC chart, and the tools preview
5. the remaining panels expose deeper areas such as performance, market context, cycle framing, network, on-chain activity, and source metadata

This reflects the current implementation in `src/views/HomePage.tsx`, `src/views/dashboard/DashboardContent.tsx`, and the shared sidebar shell.

## Homepage Module Roles

### Overview Workspace

Current purpose:

- orient the user quickly
- show dashboard-level refresh state
- surface the first market read and chart without requiring a long page scroll
- bridge directly into tools when the user wants to act

### Overview

Current purpose:

- make spot price and key market metrics the first factual read

### Cycle And Performance

Current purpose:

- add broader market context without turning the page into a trading terminal

### Chart

Current purpose:

- provide the main exploratory area for short-range BTC price movement inside the overview workspace

### Sentiment And Market Context

Current purpose:

- place price action beside Fear & Greed and broader market structure

### On-Chain, Network, And Halving

Current purpose:

- provide deeper technical context for users who want more than price and sentiment

### Tools Preview

Current purpose:

- bridge the overview workspace into the tools area without turning the dashboard into a multi-tool surface

## Current Tools IA

### Tools Overview Page

The tools landing page currently contains:

- page intro and featured-tool CTA
- a short framing section that explains the tools philosophy
- a highlight card for the DCA calculator
- the current live tools list
- a secondary card that keeps the area intentionally small and curated

### DCA Calculator Page

The DCA page currently contains:

1. page hero
2. market data toolbar with manual refresh
3. insight summary card
4. summary metrics grid
5. calculator form
6. entry history list

This reflects the current page implementation in `src/views/DcaCalculatorPage.tsx`.

## Localization Implications

Current IA rules depend on localization:

- every public page has a `de` and `en` variant
- canonical and alternate locale metadata are generated per route
- language switching is part of the shared site shell
- page structure remains aligned across locales

## Current IA Principles

The shipped IA follows these practical rules:

- price and orientation come before deeper context
- tools are visible but not the main homepage focus
- data-heavy areas are grouped into focused workspaces instead of one long KPI wall
- legal routes are present but remain secondary navigation items
- internal APIs stay separate from the public content tree

## Decision Summary

The current information architecture remains deliberately small, but the homepage now behaves more like a focused workspace: one localized dashboard route with section-based panels, one localized tools route, one localized DCA route, and secondary legal pages.
