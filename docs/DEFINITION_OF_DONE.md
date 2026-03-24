# Definition Of Done

## Purpose

This document defines the minimum bar for considering work complete in this repository.

A task is not done when code only works in isolation. It is done when it fits the current architecture, preserves the V1 product boundaries, and is verified against the runtime model the project actually uses today.

## General Quality

Every completed change should meet this baseline:

- `npm run build` succeeds
- `npm run lint` succeeds
- type safety is preserved
- existing behavior outside the intended scope is not regressed
- the change respects the architectural boundaries documented in `docs/ARCHITECTURE.md`
- no dead code, placeholders, or unexplained abstractions are introduced
- naming and file placement are clear enough that the change is understandable from the codebase itself

## UI Work

For any route, component, or interaction change:

- responsive behavior is checked on common desktop and mobile layouts
- loading, error, and empty states are handled where relevant
- stale and partial-data behavior is handled where the section can degrade gracefully
- accessibility basics are respected
- user-facing copy matches the current product tone and localization setup
- locale-prefixed routing behavior remains intact for public pages
- client components only own browser-side concerns that actually belong on the client

## API And Server Work

For any route handler, server helper, or provider integration change:

- the UI continues to receive normalized app-level contracts
- raw provider schemas do not leak into shared UI types
- errors are mapped deliberately instead of passed through as unstructured upstream failures
- cache behavior is reviewed and kept explicit at the route boundary
- environment changes are documented where contributors will actually see them
- Cloudflare Workers plus OpenNext compatibility is preserved

## Testing

Testing expectations are applied with judgment, but not skipped casually.

- meaningful tests are added or updated when behavior, mapping logic, or regression risk changes
- `npm run test` remains green for normal feature work
- shared utilities, mappers, server helpers, and provider validation should usually have direct coverage
- if tests are intentionally not updated, the reason should be obvious from the scope and risk of the change

## Documentation

Docs must stay aligned with the implementation.

- `README.md` and relevant files under `docs/` are updated when routes, behavior, setup, architecture, or runtime expectations change
- current-state docs should describe what exists, not drift back into outdated early-stage wording
- roadmap or follow-up planning docs should remain clearly separate from current-state documentation
- environment setup changes are reflected in the docs contributors actually use

## Deployment Awareness

A change is not complete if it works locally but breaks the intended deployment model.

- the change remains compatible with Cloudflare Workers through OpenNext
- `npm run dev` still works for normal contributor workflows
- if the change affects Cloudflare-specific behavior, the impact on `npm run cf:build`, `npm run cf:preview`, or deployment is considered before closing the task

## Review Checklist

Use this checklist when closing a task or reviewing a PR:

- [ ] the task is fully solved
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds
- [ ] type safety is preserved
- [ ] `npm run test` succeeds, or any intentional gap is justified by scope
- [ ] UI work includes the right async states and responsive checks
- [ ] API work returns normalized app-level data
- [ ] no provider-specific leakage was introduced into UI contracts
- [ ] docs were updated where behavior or setup changed
- [ ] the change still fits the current Cloudflare/OpenNext runtime target
- [ ] no unrelated cleanup or dead code was left behind

## Working Rule

If a contributor cannot use this document to confidently say "this task is complete," the task is not done yet.

