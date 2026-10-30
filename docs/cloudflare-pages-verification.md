# Phase 1.5: Pages deployment and Access verification

## Scope and evidence

Repository review: 2026-10-30. Local checks exercise a production Vite build with
Wrangler Pages' local workerd runtime. They do not prove Cloudflare edge behavior,
DNS, deployed build settings or Access enforcement. The operator reports that
Access is configured externally; no external Access configuration or anonymous
production responses were inspected for this phase. No Cloudflare settings are
changed by these tests or by GitHub Actions.

## Architecture and configuration review

| Repository evidence              | Result                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler.jsonc`                 | Supported JSONC format, project name `bitcoin-dashboard`, output `./dist`, compatibility date `2026-10-26`; no bindings or Node compatibility flag required. The public project hostname need not equal this local name. External project settings still need comparison. |
| `vite.config.ts`, `package.json` | React build to `dist`; `public/` assets copied by Vite. The `/api` proxy applies only to Vite development. `vite preview` does not run Pages Functions.                                                                                                                   |
| `public/_routes.json`            | Version 1 invocation rules include `/api/*`, no excludes. Other requests use static serving and the SPA fallback. This is routing, not authentication.                                                                                                                    |
| React routes in `src/App.tsx`    | `/`, `/market`, `/blockchain`, `/mining`; wildcard renders “Seite nicht gefunden” and return link.                                                                                                                                                                        |
| SPA fallback                     | No top-level `404.html` or redirect rewrite. Frontend deep links receive `index.html` with HTTP 200; React renders its own 404 for unknown frontend URLs.                                                                                                                 |
| Functions                        | `/api/health` handles GET; `/api/bitcoin/[resource]` accepts the five existing resources. `functions/api/[[path]].ts` returns structured JSON 404 for unmatched API paths. Specific file routes take precedence over the catch-all.                                       |
| Headers                          | `_headers` supplies static security headers. Functions explicitly set their own headers in `functions/lib/response.ts`, including `no-store`. No security header is weakened.                                                                                             |
| CI                               | Existing quality checks retained; Chromium tests added after build and Functions compilation. No deploy step, Cloudflare credentials or production requests.                                                                                                              |

The configuration follows Cloudflare's documented
[Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/),
[Functions routing and invocation rules](https://developers.cloudflare.com/pages/functions/routing/),
[SPA serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) and
[static header scope](https://developers.cloudflare.com/pages/configuration/headers/).
The local integration tests found no routing defect, including at `/api` and nested
unknown API paths. Routing files and production application behavior remain unchanged.

Externally compare both production and preview build settings with README's
Node/npm requirements, `npm run build`, output `dist`, repository root and the
intended production branch. Inspect deployed Functions and the copied routing/header
files in build results. Local compilation alone does not verify their deployment.

## Local automated verification

Use Node 22.22.2 and bundled npm 10.9.7 (see `.nvmrc` and `packageManager`):

```sh
npm ci
npx --no-install playwright install --only-shell chromium
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run pages:check
npm run test:e2e
```

On Linux, use `npx --no-install playwright install --with-deps --only-shell chromium`
to install OS dependencies too. On Windows PowerShell, use `npm.cmd`/`npx.cmd` if
execution policy blocks script shims. Playwright is a locked development dependency;
the browser revision follows that version.

`test:e2e` requires a fresh `dist` from `npm run build`. Playwright starts and stops
`wrangler pages dev dist` itself on **127.0.0.1:8799**, waits for `/api/health`,
and refuses to reuse an existing server. Free that port if startup fails. No remote
runtime or Cloudflare login is used. `pages:check` compiles Functions separately;
it neither starts a server nor deploys anything.

- `e2e/dashboard.spec.ts`: Chromium loads the real built HTML, CSS and JavaScript;
  controlled, fixed-time API fixtures cover initial data rendering, navigation among
  all four views, every deep link and reload, React 404 recovery, API 401/403/502/504
  failures with usable navigation, and persistent light/dark mode. Every UI test
  checks uncaught exceptions and console errors; only expected HTTP failure status
  messages are allowed. Unexpected external requests and unmocked API calls fail.
- `e2e/pages.spec.ts`: real HTTP requests without interception verify health GET/405,
  unknown API JSON 404s (including nested paths and the API root), all five supported
  Bitcoin route dispatches via POST/405, SPA fallback and built JS/CSS delivery with
  security headers. POST is rejected before upstream fetching. Successful Bitcoin
  upstream GET behavior remains covered by the existing mocked adapter/unit tests.

No test depends on public mempool.space availability. Browser mocks do not establish
that real upstream GETs work at the edge. Access authentication, edge caching, TLS,
DNS, mobile browsers and other browser engines are outside this suite.

## CI behavior

The existing verify job uses the pinned Node and bundled npm, `npm ci`, lint,
format, Vitest, all TypeScript checks (now including Playwright), build and
`pages:check`. It then installs Chromium headless shell plus Linux dependencies
and runs `test:e2e`. This follows the official
[Playwright CI guidance](https://playwright.dev/docs/ci).

One browser worker, no retries, 30 seconds per test, 60 seconds for server startup,
three minutes for the suite and 15 minutes for the job bound failures. The list
reporter prints failures in CI. Only failed-test traces/screenshots are retained
in ignored `test-results/`, uploaded on failure for three days. No videos, browser
cache or successful-run report bundles are uploaded. View a trace locally with
`npx --no-install playwright show-trace test-results/<test-directory>/trace.zip`.
Existing push branch filters and pull-request triggers remain unchanged.

## Manual external Access verification (separate release gate)

### Inventory and review in Cloudflare (read-only)

Record actual application names/IDs, hostname/path rules, policy decisions and the
deployed commit. Do not copy tokens, cookies or personal identity details into the
public repository or PR. Check every reachable hostname, including old deployments:

| Hostname                                         | Required coverage                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `bitcoin.falkner.info`                           | Explicit custom-domain application/public hostname covering all paths.                                 |
| `bitcoin-dashboard-erm.pages.dev`                | Explicit production Pages hostname coverage; the preview wildcard does not cover this parent hostname. |
| `<hash>.bitcoin-dashboard-erm.pages.dev`         | Preview coverage for each deployment, including older still-reachable hashes.                          |
| `<branch-alias>.bitcoin-dashboard-erm.pages.dev` | Preview wildcard or explicit coverage, verified for each existing alias from deployment details.       |

Pages' **Enable access policy** option protects previews, and must not be assumed
to protect the production Pages hostname or custom domain. Review the separate
hostname applications described in Cloudflare's
[Pages Access known issues](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain).
This is a review checklist, not authorization to change applications.

Preview aliases move with branches; old hash URLs can remain accessible. Inventory
them in Workers & Pages deployment details, including production deployment hashes
if exposed, and any custom domains attached to branches. See
[Preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

For every application, check full-host coverage (empty Path or documented whole-host
pattern), explicit authorized identities and no unintended Everyone, Bypass, public
destination overrides or narrower-path exceptions. Inspect overlapping applications:
more specific paths may take precedence without inheriting the parent policy.
Wildcard subdomains do not cover the parent hostname. See
[Access application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).
HTML, `/assets/*`, fonts and `/api/*` must all be protected, including health and
unknown API URLs. Security headers, `noindex`, JSON errors and hidden navigation
are not access controls.

### Anonymous GET requests

Use a fresh browser profile with no Access/identity-provider session, no cached
dashboard files and no service tokens. Private browsing may still benefit from
device/WARP identity or an existing identity-provider login: record that context and
repeat with a clean client outside any trusted network/device policy as appropriate.
An authenticated tab, cached UI or a browser reload alone is not anonymous evidence.

Prefer independent curl GETs without cookies or Authorization. The example works
in PowerShell with `curl.exe`; on Linux/macOS use `curl`. `-q` must be first to ignore
curl configuration. Do not use `-L` on the initial probe or add a cookie jar:

```sh
curl.exe -q --silent --show-error --max-time 20 --dump-header headers.txt --output body.txt https://bitcoin.falkner.info/api/health
```

Repeat for **each inventoried hostname** and every path below, saving or reviewing
headers AND body for each request (the example files are overwritten). Use an
existing asset from the currently deployed build, obtained from an authorized view
or deployment artifact; a nonexistent asset can return SPA HTML and is inconclusive.

| Request paths                                                                                                          | Content that must not be returned anonymously                 |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/`, `/market`, `/blockchain`, `/mining`, `/unknown/deep-link`                                                         | Dashboard HTML/React shell, including its frontend 404 shell. |
| Actual `/assets/<hash>.js`, `/assets/<hash>.css`, a deployed font                                                      | Application assets or font bytes.                             |
| `/api/health`                                                                                                          | Application health JSON.                                      |
| `/api/bitcoin/height`, `/api/bitcoin/latest-block`, `/api/bitcoin/blocks`, `/api/bitcoin/fees`, `/api/bitcoin/mempool` | Bitcoin response data.                                        |
| `/api`, `/api/`, `/api/unknown`, `/api/unknown/nested`                                                                 | Application JSON errors or SPA HTML.                          |

For API probes, also repeat with `--header "Accept: application/json"`. Use GET,
not just HEAD: a status/header check alone cannot establish what content leaked.

Acceptable anonymous results are an Access login redirect, an Access login page,
or an identifiable Access denial, with **no protected application content**. Inspect
`Location` on redirects: a canonical-host redirect is not yet proof of protection;
probe its destination independently with the same clean client until reaching the
Access gate. Never forward credentials to a redirect target. API requests may be
redirected to login instead of receiving JSON; this is acceptable for this gate.

A 200 dashboard shell, JS/CSS/font, health or Bitcoin JSON indicates possible missing
coverage. Even an application-generated JSON 404/405/502/504 means the unauthenticated
request reached the application and fails this gate. A generic 403, unrelated 404,
DNS error or timeout does not establish Access coverage: identify the denying layer
and resolve/retest. A 200 login page can be acceptable only after verifying it is
the Access login page and contains no dashboard content.

Record UTC time, hostname, path, deployed commit, status, content type, redirect
destination and whether protected bytes were present; mark each result pass/fail/
inconclusive. Do not publish response bodies, login URLs with sensitive parameters,
cookies or tokens. Missing evidence is **not verified**. Any exposed content requires
operator remediation and retesting before external security approval.

Finally, in a separate authenticated session, verify an authorized identity can load
each intended hostname, deep links, assets and API data, and that an unauthorized
identity is denied. This positive check detects broken login flows but does not
replace anonymous checks. External release approval remains open until real results
are recorded; passing local CI cannot approve Cloudflare Access.
