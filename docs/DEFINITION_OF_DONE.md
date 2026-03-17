# Definition Of Done

## Purpose

This document defines the minimum bar for considering implementation work complete in this repository.

It exists to keep future work consistent across human and AI-assisted contributions. A task is not done when code merely "works once." It is done when it meets the quality, architecture, and verification standards below.

These standards apply to:

- new features
- route or API changes
- UI updates
- refactors that change behavior or structure

## General quality

Every completed change should meet the following baseline:

- the project builds successfully with `npm run build`
- lint passes with `npm run lint`
- type safety is preserved and no new TypeScript errors are introduced
- existing behavior outside the intended change is not regressed
- code follows the current project structure and architectural boundaries described in [ARCHITECTURE.md](/c:/Users/chris/Documents/GitHub/bitcoin-dashboard/docs/ARCHITECTURE.md)
- no dead code, unused abstractions, placeholder branches, or commented-out logic are added without a clear purpose
- naming is clear enough that the change is understandable without excessive explanation
- new logic is placed in the appropriate layer instead of being mixed across route, UI, and provider concerns

## UI work

For any route, component, or interactive UI change:

- responsive behavior is checked for common mobile and desktop layouts
- loading states are present where users may need to wait for data or async actions
- error states are present where data fetching or actions can fail
- empty states are present where no data is a valid outcome
- accessibility basics are respected, including semantic markup, accessible labels, keyboard usability where relevant, and sufficient contrast within the existing design direction
- user-visible copy is clear and consistent with the product language already used in the app
- client components only own browser-specific state and interaction concerns that belong on the client

## API and server work

For any route handler, server helper, or provider integration change:

- the UI receives a typed and intentional response shape
- provider data is validated or normalized before it is exposed to the rest of the app
- errors are handled deliberately and return an application-level response instead of an unstructured provider failure
- raw provider payload details do not leak directly into UI-facing contracts unless the project explicitly adopts them
- server-only responsibilities stay in server code and are not pulled into client modules
- environment variable additions or changes are documented in the relevant docs if setup or deployment behavior changes
- runtime behavior remains compatible with the current Cloudflare Workers plus OpenNext deployment target

## Testing

Testing expectations should be applied with judgment, but they are not optional.

- meaningful tests are added or updated when the change introduces logic, branching behavior, data shaping, or regression risk
- existing tests remain green with `npm run test`
- changes to shared utilities, server helpers, or data transformation logic should normally include direct test coverage
- if a change is intentionally not covered by tests, the reason should be clear from the scope and risk of the work

## Docs

Documentation should stay aligned with the implementation.

- `README.md` or relevant docs under `docs/` are updated when behavior, setup, architecture, routes, or operational expectations change
- new conventions are documented when a contributor would not reasonably infer them from the existing codebase
- environment setup changes are reflected in the docs that contributors will actually use

## Deployment awareness

A change is not complete if it works only in an isolated local path but breaks the intended runtime model.

- the change remains compatible with the current Cloudflare Workers deployment through OpenNext
- the local development flow still works for normal contributor usage, especially `npm run dev`
- if the change affects Cloudflare-specific behavior, the impact on `npm run cf:build` or preview flow is considered before closing the task

## Review checklist

Use this checklist when closing an issue or reviewing a PR:

- [ ] the change solves the stated task completely, not partially
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds
- [ ] type safety is preserved
- [ ] `npm run test` succeeds, or any intentionally skipped coverage is justified by scope
- [ ] UI changes include appropriate loading, error, and empty states where needed
- [ ] responsive behavior was checked for UI work
- [ ] API or server changes return normalized, typed app-level data
- [ ] no provider-specific leakage was introduced into UI contracts
- [ ] docs were updated if behavior, architecture, routes, or environment setup changed
- [ ] the change still fits the current Cloudflare/OpenNext deployment target
- [ ] no obvious dead code, placeholder logic, or unrelated cleanup was left behind

## Working rule

If a contributor cannot use this document to confidently say "this task is complete," then the task is not done yet.
