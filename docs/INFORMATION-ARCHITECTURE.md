# Information Architecture

## Purpose

This document describes the current content hierarchy and route structure of the shipped V1 product. It focuses on what exists today rather than proposing a future layout.

## Top-Level Navigation

The current primary navigation is intentionally small:

- Dashboard
- Tools

Supporting links currently live in the footer:

- legal notice route (`/impressum`)
- privacy route (`/datenschutz`)

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

The homepage currently follows this order:

1. localized page header and navigation
2. homepage intro with product framing and dashboard refresh controls
3. overview section for spot price and market snapshot
4. ATH context section
5. performance section
6. main BTC chart section
7. market-and-sentiment group
8. on-chain activity section
9. network overview section
10. halving section
11. tools preview section
12. metadata/footer section
13. site footer

This order reflects the current implementation in `src/views/dashboard/DashboardContent.tsx` plus `HomepageIntro.tsx`.

## Homepage Module Roles

### Intro

Current purpose:

- orient the user quickly
- show dashboard-level refresh state
- link directly to the chart and tools
- surface warnings without hiding useful data

### Overview

Current purpose:

- make spot price and key market metrics the first factual read

### ATH And Performance

Current purpose:

- add broader market context without turning the page into a trading terminal

### Chart

Current purpose:

- provide the main exploratory area for short-range BTC price movement

### Sentiment And Market Context

Current purpose:

- place price action beside Fear & Greed and broader market structure

### On-Chain, Network, And Halving

Current purpose:

- provide deeper technical context for users who want more than price and sentiment

### Tools Preview

Current purpose:

- bridge the dashboard into the tools area without making tools the primary page focus

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
- data-heavy areas are grouped into coherent sections instead of a flat KPI wall
- legal routes are present but remain secondary navigation items
- internal APIs stay separate from the public content tree

## Decision Summary

The current V1 information architecture is simple and deliberate: one localized dashboard route, one localized tools route, one localized DCA tool route, and a homepage structure that moves from fast orientation to deeper Bitcoin context.
