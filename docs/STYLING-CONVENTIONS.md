# Styling Conventions

## Purpose

This document describes the styling conventions used by the current V1 codebase.

## Current Styling Stack

The app currently uses:

- Tailwind CSS 4 for most component styling
- `src/styles/tokens.css` for semantic design tokens
- app-wide global styles in `src/app/globals.css`
- targeted feature CSS in `src/styles/*.css` where the current implementation still needs it

## Current Defaults

The default styling approach is:

- build layout and component styling with Tailwind utilities
- use token-backed classes and CSS variables instead of repeating raw values
- rely on shared primitives such as `Button`, `Surface`, layout components, and `cn()` before creating one-off wrappers
- keep global CSS focused on app-wide concerns rather than page-specific styling

## Current Exceptions

Some feature styling still lives outside utility-first component files.

Current example:

- the DCA calculator imports dedicated stylesheets for its layout and form presentation

This is acceptable when the feature already exists in that form, but new shared UI should still prefer the token-plus-Tailwind path.

## Token Usage Rules

Contributors should currently:

- use `src/styles/tokens.css` as the first stop for shared visual values
- avoid introducing fresh hard-coded color, radius, shadow, or motion values when an existing token already covers the need
- extend tokens only when the value is meaningfully reusable

## Primitive Reuse Rules

Prefer the existing shared UI primitives when possible:

- `Button`
- `Surface`
- layout primitives under `src/components/ui/layout`
- content primitives under `src/components/ui/content`
- async-state primitives under `src/components/ui/data-state`

## Current Visual Character

The current styling system aims for:

- calm, high-contrast surfaces across dark and light system themes
- clear structure through borders more than shadow
- signal orange as a controlled accent inside a cooler obsidian-and-ice palette
- expressive but disciplined typography
- readable data presentation on both desktop and mobile

## Review Rule

When adding or changing UI, the question is not only whether it looks fine in isolation, but whether it still feels like the same product system already present in the app.
