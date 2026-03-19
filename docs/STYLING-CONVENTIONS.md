# Styling Conventions (V1)

## Purpose

This document defines the practical styling rules for the V1 UI foundation.

## Rules

- Tailwind utilities are the default choice for component styling.
- `src/app/globals.css` is reserved for app-wide base concerns only.
- Legacy feature styling that has not been migrated yet lives outside `globals.css`.
- Semantic tokens from `src/styles/tokens.css` should be used instead of repeating raw design values.
- Shared primitives and helpers such as `cn()`, `Button`, and `Surface` should be preferred over one-off wrappers.
- CSS Modules are allowed only when utility classes are a poor fit for the problem.
- New UI code should not introduce fresh hard-coded color, radius, shadow, or motion values when an existing token or utility already covers the need.

## Token Scope

The current token layer covers:

- app, surface, elevated, and muted backgrounds
- primary, secondary, muted, and inverse text
- accent, success, warning, danger, and info roles
- border roles
- spacing scale
- radius scale
- shadow roles
- motion timings
- async state roles
- font roles for sans, serif, and mono

## Migration Approach

- Migrate shared primitives first.
- Keep proof migrations intentionally small.
- Avoid mixing styling foundation work with data or API refactors.
