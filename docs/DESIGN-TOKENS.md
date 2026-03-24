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

- a dark base surface system
- warm off-white text instead of stark white-on-black
- orange as the primary accent color
- restrained semantic colors for success, warning, danger, and info
- tight radii rather than soft bubble styling
- almost no heavy shadow elevation
- calm motion timing

## Current Font Tokens

The token layer currently uses:

- `Instrument Sans Variable` for UI and body text
- `Newsreader Variable` for selected serif accents
- `IBM Plex Mono` for technical and numeric presentation

These token families match the font packages currently installed in `package.json`.

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
