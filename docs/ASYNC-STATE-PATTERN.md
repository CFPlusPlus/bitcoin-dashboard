# Async State Pattern

## Goal
Create one calm, reusable pattern for data-driven UI across dashboard sections and tool pages.

The system standardizes these states:

- `loading`
- `success`
- `empty`
- `partial`
- `error`
- `stale`
- `refreshing` as a sub-state when usable data already exists

## Shared Model

`resolveAsyncDataState` in [src/lib/data-state.ts](/c:/Users/chris/Documents/GitHub/bitcoin-dashboard/src/lib/data-state.ts) derives a consistent UI state from:

- `data`
- `error`
- `isLoading`
- `hasUsableData`
- `isEmpty`
- `isPartial`
- `lastUpdatedAt`

Rules:

- `loading`: use when there is no usable data yet and the first fetch is still running.
- `success`: use when usable data is available and there is no empty/error/partial override.
- `empty`: use when the request succeeded but returned no useful content.
- `partial`: use when some content is still usable but the payload is incomplete.
- `error`: use when no usable fallback exists.
- `refreshing`: use when a new fetch is running while useful data is still on screen.
- `stale`: use when older data stays visible after a failed refresh, or when the last success is older than the freshness threshold.

Current freshness threshold:

- Data becomes stale after 5 minutes without a successful update.

## UI Building Blocks

Shared primitives live in [src/components/ui/data-state](/c:/Users/chris/Documents/GitHub/bitcoin-dashboard/src/components/ui/data-state).

Use these pieces together:

- `DataState`: gates full-state rendering and preserves content when partial/stale data is still useful.
- `LoadingState`, `EmptyState`, `ErrorState`, `PartialState`, `StaleState`: full or compact status panels.
- `DataStateMeta`: header-level freshness/status summary.
- `LastUpdated`: relative timestamp with exact time in the tooltip.
- `RetryButton`: consistent retry affordance.
- `StaleBadge`: explicit stale marker for preserved data.

## Behavior Rules

- Keep the surrounding section shell mounted whenever possible.
- Do not replace valid content with a full loading state during refresh.
- Show compact notices only when the user needs reassurance or action.
- Put quiet status signals in section headers: refreshing, partial, stale, last updated.
- Prefer preserving useful data over collapsing the whole section.
- Offer retry when a fetch fails and the user can meaningfully act.

## Copy Conventions

Tone:

- calm
- factual
- concise
- non-alarmist

Guidelines:

- Say what is happening, not how the user should feel.
- Prefer concrete language such as "Letzte Marktdaten bleiben sichtbar" over vague fallback copy.
- Use "gerade nicht verfuegbar" instead of harsher failure language.
- Use "teilweise verfuegbar" for incomplete payloads.
- Use "kann veraltet sein" for stale data.
- Use `Erneut laden` for retry labels unless a more specific verb materially improves clarity.

## Usage Notes

- Dashboard sections should expose status in `SectionHeader.meta` with `DataStateMeta`.
- Tool pages can reuse the same pattern even when the rest of the page still uses older layout styles.
- Derive partial state close to the consuming view when "usable" depends on the section's actual fields.
