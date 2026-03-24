# Design Tokens

## Purpose

This document describes the token system that is currently implemented in `src/styles/tokens.css`. It is the active styling foundation for the V1 UI.

## Current Source Of Truth

Implemented token source:

- `src/styles/tokens.css`

The token layer currently defines:

- dark-mode-first base colors
- semantic text and accent colors
- border colors
- spacing tokens
- radius tokens
- shadow roles
- motion tokens
- async-state color roles
- font-family tokens
- layout tokens for containers and spacing

## Current Token Naming

The current token set uses these naming families:

- `--token-color-*`
- `--space-*`
- `--token-radius-*`
- `--token-shadow-*`
- `--motion-*`
- `--state-*`
- `--token-font-family-*`
- `--container-*`
- `--section-gap`
- `--grid-gap`

## Current Visual Direction Expressed By Tokens

The implemented token layer currently expresses:

- an obsidian-and-ice surface system for both dark and light modes
- cool high-clarity text tones instead of warm paper neutrals
- signal orange as the primary accent color
- restrained semantic colors for success, warning, danger, and info
- tight radii rather than soft bubble styling
- almost no heavy shadow elevation
- calm motion timing

## Current Font Tokens

The token layer currently uses:

- `Instrument Sans Variable` for UI and body text
- `Newsreader Variable` for selected serif accents
- `IBM Plex Mono` for technical labels and compact metadata
- `Geist Mono Variable` for prominent numeric display values

These token families match the font packages currently installed in `package.json`.

## Typography Role Matrix

Typography should stay calm and role-driven rather than expressive everywhere.

Use the families like this:

- `--token-font-family-sans` / `font-sans`: default UI text, body copy, navigation, buttons, forms, descriptive text
- `--token-font-family-serif` / `font-serif`: section titles, editorial accents, selected headline moments
- `--token-font-family-mono` / `font-mono`: eyebrows, labels, compact status text, metadata, small technical annotations
- `--token-font-family-numeric` / `font-numeric`: prominent values, KPI numbers, prices, countdowns, chart values, numeric callouts

## Typography Usage Rules

Current typography rules for contributors:

- default to sans-serif for standard product UI and reading text
- use serif sparingly so headline accents remain premium and quiet
- use mono for technical framing, not for large hero values by default
- use numeric display type for prominent numbers that should feel precise and technical
- apply `tabular-nums` to dynamic, comparable, or repeatedly aligned numeric values
- most components should stay within two explicit typographic roles
- editorial shell components may combine sans body text, mono metadata, and serif headlines when that hierarchy is intentional
- avoid using `font-mono` and `font-numeric` for equally emphasized content inside the same small block
- if a value is the primary focus and a label is secondary, the value should usually use `font-numeric` and the label should usually use `font-mono`

## Current Color Roles

The token system currently covers these role groups:

- app, surface, elevated, and muted backgrounds
- primary, secondary, muted, inverse text
- primary, soft, and strong accent roles
- success, warning, danger, and info roles
- subtle, default, and strong border roles
- loading, empty, partial, error, and stale state colors

## Current Spacing And Layout Roles

The implemented spacing scale currently includes:

- `--space-1` through `--space-16`

The implemented layout roles currently include:

- `--container-max-width`
- `--container-padding-x`
- `--section-gap`
- `--grid-gap`

## Current Radius, Shadow, And Motion Roles

Implemented radius roles:

- `--token-radius-sm`
- `--token-radius-md`
- `--token-radius-lg`
- `--token-radius-xl`

Implemented shadow roles:

- `--token-shadow-surface`
- `--token-shadow-elevated`

Implemented motion roles:

- `--motion-fast`
- `--motion-base`
- `--motion-slow`
- `--ease-standard`

## Usage Rules

Current rules for contributors:

- prefer token-backed values over new hard-coded color, radius, spacing, or motion values
- treat tokens as the default source for shared UI styling
- add new tokens only when the value is genuinely reusable or semantic
- do not bypass the token layer for shared primitives without a clear reason

## Relationship To Tailwind And CSS

The current UI uses tokens alongside Tailwind utilities.

In practice this means:

- Tailwind is the default authoring surface for components
- tokens provide the semantic values and visual guardrails
- feature-specific CSS still exists where the current implementation needs it, especially around the DCA page

## Decision Summary

The token system is no longer just a design intention. It is implemented and already underpins the current V1 visual language.
