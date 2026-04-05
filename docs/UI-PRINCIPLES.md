# UI Principles

## Purpose

This document captures the current UI direction of the Bitcoin Dashboard. It is not a speculative design brief; it reflects the principles already visible in the shipped V1 product and should guide future UI changes.

## Product Character

The product should read as:

- Bitcoin-first
- calm
- serious
- data-focused
- modern
- slightly premium
- usable on desktop and mobile

It should not read as:

- a trading casino
- a meme-crypto product
- a generic admin template
- an overcrowded KPI wall
- a playful dashboard with no point of view

## Core Principles

### Bitcoin-First

The product stays focused on Bitcoin. It should not drift toward a broad crypto-market identity.

### Data-First

Content comes before decoration. Visual styling should support reading and orientation.

### Fast Orientation

A user should understand the current Bitcoin picture within seconds.

### Calm Density

The UI can be information-rich, but not frantic. Grouping, spacing, and emphasis matter more than adding more cards.

### Reusable System

A small set of strong shared patterns is better than many disconnected one-offs.

### Mobile-Complete

Desktop may lead the composition, but mobile must preserve the product's full meaning and core actions.

## Current Visual Direction

The current implementation expresses these decisions:

- a monochrome obsidian base that supports both dark and light system themes
- one restrained accent color used for active states and important emphasis
- cooler text tones with cleaner contrast instead of warm paper styling
- standardized medium radii and crisp surfaces
- restrained shadows with more emphasis on borders and layering
- clean sans-serif typography throughout the product
- mono treatment for many technical values and metrics

The app shell should now read closer to a focused SaaS workspace:

- a persistent sidebar on desktop
- one active dashboard panel at a time
- compact utilities and navigation instead of a wide top navbar

## Motion Principles

Motion should stay supportive.

Allowed:

- subtle hover reactions
- soft transitions
- refresh feedback
- quiet state transitions

Avoid:

- constant motion
- showpiece animation
- gamified or noisy effects

## State Principles

Async states are part of the design system, not edge cases.

The UI should:

- preserve useful content during refresh
- communicate stale and partial states clearly
- keep retry behavior calm and consistent
- avoid dramatic failure language

## Product Boundaries Reflected In UI

The UI should keep reinforcing that this product is:

- a dashboard for understanding Bitcoin
- a small tools surface for practical calculations
- not a portfolio manager
- not a multi-asset product
- not a trading terminal
- not a generic admin template with interchangeable sections

## Review Questions

Before shipping a UI change, check:

1. Does it improve understanding of the current Bitcoin picture?
2. Does it fit the existing calm and serious tone?
3. Does it reuse or strengthen the current component system?
4. Does it remain usable on mobile?
5. Does it keep the Bitcoin-only focus intact?

## Decision Summary

The current UI direction in the codebase is a calm, monochrome, sidebar-based Bitcoin workspace that stays more focused than broad crypto dashboards or generic admin kits.
