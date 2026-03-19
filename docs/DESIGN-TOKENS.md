# Design Tokens (V1 Draft)

## Purpose

This document defines the foundational design tokens for V1.
It is the basis for a consistent UI system and should make later design work easier.

Important:
The values and roles defined here are a **first direction**, not a final brand style guide.
They should create stability without blocking later refinement.

---

## 1. Core Principles

The token system should:

- be dark-mode-first
- feel calm and data-focused
- use orange as an accent in a controlled way
- rely on a small set of consistent surfaces
- create clear hierarchy through typography and spacing

---

## 2. Color Roles

Instead of spreading hard-coded individual values too early, the system should use semantic roles.

## 2.1 Base Colors

- `--color-bg-app`
- `--color-bg-surface`
- `--color-bg-elevated`
- `--color-bg-muted`

## 2.2 Text Colors

- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-text-inverse`

## 2.3 Accent Colors

- `--color-accent-primary`
- `--color-accent-soft`
- `--color-accent-strong`

## 2.4 Semantic Colors

- `--color-success`
- `--color-warning`
- `--color-danger`
- `--color-info`

## 2.5 Border Colors

- `--color-border-subtle`
- `--color-border-default`
- `--color-border-strong`

---

## 3. Color Character for V1

### Base

- very dark app background
- flat, matte surfaces without gradients
- lightly stepped surface layers
- avoid relying only on pure black hard surfaces
- strong contrast, but not overly harsh

### Accent

- orange as the focus color
- only use the accent where attention should be guided deliberately:
  - active states
  - highlights
  - small emphasis
  - relevant CTAs
  - selected data accents

### Semantics

- positive values: calm, not aggressive
- negative values: clearly visible, but not alarmist
- warning / info: functional, not colorful for its own sake

---

## 4. Typography Tokens

## 4.1 Font Families

- `--font-sans`: primary typeface for UI and body text
- `--font-serif`: accent typeface for headings or highlights
- `--font-mono`: typeface for numbers, KPIs, and technical values

## 4.2 Typographic Roles

- `--text-display`
- `--text-h1`
- `--text-h2`
- `--text-h3`
- `--text-body-lg`
- `--text-body`
- `--text-body-sm`
- `--text-label`
- `--text-kpi`
- `--text-metric-sm`
- `--text-caption`

## 4.3 Typography Principles

- body text: sans-serif, clean, highly readable
- headings: primarily sans, with selective serif accents
- numbers: technical, precise, stable
- avoid too many size steps
- clear hierarchy matters more than decorative type variety

---

## 5. Spacing Tokens

Spacing should create calmness, rhythm, and grouping.

## 5.1 Base Scale

Recommended scale:

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px

## 5.2 Usage Rules

- small internal spacing for dense UI elements
- medium spacing inside cards
- large spacing between sections
- group spacing should feel stronger than item spacing

---

## 6. Radius Tokens

Surfaces should feel precise, calm, and architectural.

Recommended roles:

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`

Recommended direction:

- noticeably tighter than typical SaaS dashboards
- no pill-heavy component language as the default
- clear geometry with only slight softening at the corners

---

## 7. Shadow / Elevation Tokens

Shadows should be used very carefully in dark mode.

Roles:

- `--shadow-xs`
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`

Principles:

- keep shadows minimal to none
- create elevation mainly through surface and border differences
- avoid floating, glassy, or layered card effects

---

## 8. Border Tokens

Borders help provide structure and readability in dark mode.

Roles:

- `--border-subtle`
- `--border-default`
- `--border-strong`

Principles:

- use fine, controlled separation
- prefer subtle edges over heavy boxes everywhere
- borders are structural, not decorative

---

## 9. Layout Tokens

## 9.1 Container

- `--container-max-width`
- `--container-padding-x`
- `--section-gap`
- `--grid-gap`

## 9.2 Surface Roles

- `surface/base`
- `surface/card`
- `surface/elevated`
- `surface/interactive`

## 9.3 Grid Principles

- desktop: generous sections and clear rhythm
- tablet: reduced multi-column complexity
- mobile: linear reading flow with full content preserved

---

## 10. Component Tokens

These roles should later be consumed by components:

### Card

- background
- border
- radius
- padding
- title style
- value style
- meta style

### KPI

- label
- main value
- delta
- timestamp
- status

### Button / CTA

- primary
- secondary
- tertiary / ghost

### Input

- background
- border
- focus ring
- placeholder
- help / error text

### Chart Container

- surface
- border
- header
- controls
- footer / meta

---

## 11. State Tokens

Every UI area should use consistent states.

## 11.1 Async States

- loading
- success
- empty
- partial
- error
- stale

## 11.2 Semantic Roles per State

- `--state-loading-bg`
- `--state-loading-fg`
- `--state-error-bg`
- `--state-error-fg`
- `--state-empty-bg`
- `--state-empty-fg`
- `--state-stale-bg`
- `--state-stale-fg`

Principle:
States are part of the design system, not just technical edge cases.

---

## 12. Motion Tokens

Motion should stay calm and supportive.

Roles:

- `--motion-fast`
- `--motion-base`
- `--motion-slow`

Easing:

- soft
- controlled
- no aggressive snaps as the default

Use for:

- hover
- focus
- expand / collapse
- refresh indication
- light entrance transitions

Do not use for:

- showcase effects
- constant motion
- distracting number animations

---

## 13. Z-Index / Layer Tokens

Recommended roles:

- `--z-base`
- `--z-sticky`
- `--z-dropdown`
- `--z-overlay`
- `--z-modal`
- `--z-toast`

Goal:
predictable layering instead of ad-hoc values.

---

## 14. Responsive Tokens

Recommended breakpoint roles:

- `--bp-sm`
- `--bp-md`
- `--bp-lg`
- `--bp-xl`

Principle:

- layout changes should be intentional
- not just compressing everything
- on mobile, reorder priorities rather than removing important content

---

## 15. Implementation Recommendation

These tokens should live in one central place in the codebase, for example:

- `src/theme/tokens.ts`
- or `src/styles/tokens.css`
- or combined with Tailwind theme extensions

Important:

- avoid scattered magic numbers
- avoid hard-coded values inside feature components
- prefer semantic naming over purely visual naming

---

## 16. V1 Summary

The V1 token system should not try to be maximally complex.
Its main purpose is to:

- create consistency
- prepare the redesign
- enable reuse
- make later refinement easier

A small, stable token system is better
than a large system that is not actually followed in practice.
