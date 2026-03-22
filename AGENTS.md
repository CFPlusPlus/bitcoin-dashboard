# AGENTS.md

## Purpose

This file is the operational guide for AI coding agents (especially Codex) working in this repository.
Use it to make safe, consistent changes that match the project's architecture and quality bar.

If this file conflicts with more specific docs, prefer the more specific doc for that domain.

## Project Snapshot

- Stack: Next.js App Router + React + TypeScript
- Runtime target: Cloudflare Workers via OpenNext
- Package manager: npm
- Main app language support: German (`de`) and English (`en`)
- Locales and routing are defined in `src/i18n/config.ts` and enforced by `middleware.ts`

## Essential Commands

Run from repository root:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:coverage
npm run cf:build
npm run cf:preview
npm run deploy
```

Important notes:

- Day-to-day local development uses `npm run dev`.
- Cloudflare parity runs via OpenNext (`cf:*` scripts).
- Do not use old Cloudflare Pages workflows.
- On native Windows, prefer `npm run dev` for regular work. OpenNext preview flows can be less reliable than in WSL.

## Source Of Truth Docs

Read these before large or cross-cutting changes:

- `docs/ARCHITECTURE.md`
- `docs/API_STRATEGY.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/ASYNC-STATE-PATTERN.md`
- `docs/STYLING-CONVENTIONS.md`
- `docs/UI-PRINCIPLES.md`

## Files Agents Should Usually Not Edit

- Generated/runtime output: `.next/`, `.open-next/`, `.wrangler/`, `dist/`, `coverage/`
- Lockfile updates only when dependency changes are intentional: `package-lock.json`

If changes appear in generated folders, treat them as build artifacts unless the task explicitly targets them.

## Architecture Boundaries (Must Follow)

- Keep `src/app` route files thin. Put page composition in `src/views`.
- Keep external provider access server-side only.
- Route handlers in `src/app/api/*/route.ts` are the app-facing backend boundary.
- Prefer mapping provider payloads via domain mappers in `src/domain/dashboard/*` when available.
- Return normalized app contracts, never raw upstream payloads.
- Reuse shared app contracts from `src/types`.
- Put runtime/provider helpers in `src/server`.
- Put reusable presentational UI in `src/components`.
- Put reusable client orchestration/state logic in `src/hooks`.
- Put pure reusable logic in `src/lib`.

## Data + API Rules

- UI must consume internal `/api/*` endpoints, not direct provider URLs.
- Normalize/validate upstream data before returning JSON.
- Preserve stable response envelopes (for example metadata like source, timestamps, partial warnings).
- Handle partial failures deliberately using `partial` + `warnings` where meaningful.
- Keep cache behavior defined at route-handler level.
- Read env only in server runtime code (`src/server/env.ts`).
- Current required env variable: `COINGECKO_DEMO_API_KEY`.

## UI, Styling, And UX Rules

- Use Tailwind utilities by default.
- Use design tokens from `src/styles/tokens.css`; avoid ad-hoc hard-coded values.
- Prefer shared primitives (`Button`, `Surface`, `cn`, layout primitives) over one-off wrappers.
- Keep UX calm, data-first, and Bitcoin-focused (not trading-terminal style).
- For async UI, follow the shared state pattern:
  - loading
  - success
  - empty
  - partial
  - error
  - stale
  - refreshing (sub-state)
- Reuse shared async state components in `src/components/ui/data-state`.

## i18n And Routing Rules

- Supported locales are `de` and `en`; default locale is `de`.
- Locale-prefixed routing is mandatory for page routes.
- Update both locale dictionaries when adding user-facing copy.
- Preserve middleware locale-cookie behavior unless explicitly changing locale strategy.

## Testing Expectations

- Add or update tests when changing logic, mapping, async state, or shared utilities.
- Prefer focused unit tests near changed domain logic.
- Use existing Vitest + Testing Library setup.
- Keep `npm run lint`, `npm run test`, and `npm run build` passing before considering task complete.

## Change Workflow For Agents

1. Understand the target behavior and identify the correct architectural layer.
2. Implement the smallest coherent change in the right folder.
3. Update or add tests for meaningful behavior changes.
4. Run verification commands relevant to the scope.
5. Update docs when behavior/contracts/setup changed.

## Definition Of Done (Agent Checklist)

Treat a task as done only when all are true:

- The requested behavior is fully implemented.
- No architecture boundaries were violated.
- Lint/build/tests pass for the changed scope (ideally full repo).
- No unrelated refactors or dead code were introduced.
- Docs were updated when needed.
- Cloudflare/OpenNext runtime expectations remain intact.

## Non-Goals

- Do not move provider fetching into client modules.
- Do not introduce raw provider schemas into UI contracts.
- Do not bypass shared tokens/primitives for new UI without strong reason.
- Do not add new major patterns when an existing project pattern already fits.
