# Product Scope: Current V1

## Product Definition

Bitcoin Dashboard is a Bitcoin-only web application for checking market conditions, network state, sentiment, and a small set of practical tools in one place.

The current product is intentionally narrow:

- Bitcoin only
- public and unauthenticated
- data-first rather than social or portfolio-driven
- focused on quick orientation plus a small tool surface

## Current User Value

The product helps users:

- understand the current Bitcoin picture without jumping between multiple sites
- read market direction, performance, and sentiment quickly
- add network and on-chain context when needed
- use a focused calculator without creating an account

## Current Audience

Primary audience:

- Bitcoin users who want a calm, reliable daily dashboard

Secondary audience:

- beginners who want a simpler entry point than full trading platforms
- regular Bitcoin followers who want one place for market, sentiment, and network context
- DCA users who want a lightweight calculator instead of portfolio software

## Current V1 Scope

### Dashboard

The home route is the product center. It currently includes:

- overview metrics for price and market structure
- performance context for multiple windows
- a price chart with short-range switching
- sentiment context via Fear & Greed
- market-context charts for market cap and volume
- on-chain activity context
- network and fee context
- halving countdown context
- a preview entry point into the tools area

### Tools

The tools section currently includes:

- a tools overview page
- a DCA calculator as the first supported utility

The DCA calculator currently supports:

- entering dated purchase rows
- calculating total invested amount, BTC amount, average buy price, current value, and PnL
- comparing entries against the current BTC market price
- storing entries locally on the current device

### Localization

The public product currently supports:

- German (`de`)
- English (`en`)

Locale-prefixed routing is part of the shipped product behavior.

### SEO And Discoverability

The current V1 product already includes:

- localized page metadata
- canonical and alternate locale metadata
- Open Graph and X images
- JSON-LD structured data for key public pages

### Legal Pages

The product currently ships localized placeholder pages for:

- imprint
- privacy

These routes are present and indexable, but their content is still placeholder content.

## Product Boundaries

The current V1 product is not:

- a portfolio tracker
- an account-based product
- a watchlist or alerting system
- a multi-asset crypto platform
- a trading terminal
- an admin or back-office system

## Current Non-Goals

The following remain out of scope for V1:

- user authentication
- saved cloud profiles
- holdings or portfolio tracking
- notifications or automation
- non-Bitcoin expansion as a primary product direction
- advanced trading workflows or technical-analysis tooling

## Scope Test For New Work

A change fits the current product when it does at least one of these things:

- improves the existing dashboard experience
- strengthens the current DCA calculator or tools area
- improves reliability, responsiveness, localization, or clarity of the existing V1 surface
- improves deployment, caching, or operational quality without changing the product category

A change does not fit when it introduces:

- identity/account systems
- portfolio or long-term holdings management
- alerting or automation systems
- feature sprawl that weakens the Bitcoin-only focus
- raw provider concepts leaking directly into the UI contract

## Decision Summary

The current V1 scope is intentionally small but already concrete: a localized Bitcoin dashboard plus a focused tools area, shipped on Cloudflare Workers and designed around quick understanding rather than platform breadth.

