# Async State Pattern

## Purpose

This document describes the async-state pattern used by the current dashboard and tool surfaces. It is already part of the shipped V1 implementation and should be reused instead of inventing one-off loading and error treatments.

## Current Model

The current shared model is built around `resolveAsyncDataState` in `src/lib/data-state.ts`.

It resolves UI state from:

- `data`
- `error`
- `isLoading`
- `hasUsableData`
- `isEmpty`
- `isPartial`
- `lastUpdatedAt`

The pattern is used on top of the app's current fetch orchestration, which is primarily powered by React Query in `useDashboardData` and local async state in feature pages such as the DCA calculator.

## Standard States

The current state vocabulary is:

- `loading`
- `success`
- `empty`
- `partial`
- `error`
- `stale`
- `refreshing` as a sub-state when useful data is already visible

Rules:

- `loading`: first fetch is running and nothing useful is available yet
- `success`: usable data is present and no stronger override applies
- `empty`: request succeeded but returned no useful content
- `partial`: some content is usable but the payload is incomplete
- `error`: no usable fallback exists
- `refreshing`: a new fetch is in flight while useful data stays on screen
- `stale`: older data remains visible after a failed refresh or after the freshness threshold is exceeded

Current freshness threshold:

- data becomes stale after 5 minutes without a successful update

## Shared UI Building Blocks

The current primitives live in `src/components/ui/data-state`.

Shared pieces:

- `DataState`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `PartialState`
- `StaleState`
- `DataStateMeta`
- `LastUpdated`
- `RetryButton`
- `StaleBadge`

## Current Usage

The pattern is already used across:

- dashboard overview, performance, chart, sentiment, network, halving, market-context, and on-chain sections
- dashboard-level refresh status in the homepage intro
- DCA market-price loading on the tool page

## Behavior Rules

The current implementation follows these rules:

- keep the surrounding section mounted whenever useful data exists
- do not replace usable content with a full loading state during refresh
- use quiet header-level metadata for refresh, stale, and partial signals where possible
- reserve page-level notice bars for persistent, user-relevant degradation instead of short-lived provider hiccups
- keep smaller partial issues inside the affected section unless key data is actually unavailable for a longer period
- show retry affordances only where the user can take a meaningful action
- preserve useful data during degraded states instead of collapsing whole sections

## Copy Rules

Current copy guidance:

- calm
- factual
- concise
- non-alarmist

Practical rules:

- say what is happening, not how the user should feel
- prefer concrete explanations over vague fallback copy
- use stable wording for degraded states so the UI stays predictable
- keep retry labels consistent unless a more specific label is clearly better

## When To Reuse It

Reuse the shared pattern when:

- a section loads data from an internal API route
- a section can become partially usable
- stale data is preferable to a blank state
- a tool page needs the same loading/error/retry language as the dashboard

Do not create a one-off async-state pattern when the shared model already fits.
