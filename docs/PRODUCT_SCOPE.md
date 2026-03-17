# Product Scope: Bitcoin Dashboard V1

## Product vision

### What the Bitcoin Dashboard is

The Bitcoin Dashboard is a focused web application for viewing essential Bitcoin market, chart, network, and sentiment information in one place, with a small set of practical Bitcoin-specific tools.

### What problem it solves

Bitcoin information is often split across multiple sites, each optimized for a single use case such as price tracking, charting, mempool data, or sentiment. This product reduces that fragmentation by giving users a fast, single-purpose dashboard for everyday Bitcoin monitoring and simple decision support.

### Why a user would choose it

A user should choose the Bitcoin Dashboard when they want:

- a Bitcoin-only experience instead of a broad crypto platform
- a quick overview of price, market, network, and sentiment signals
- lightweight tools without account creation or setup friction
- a clear, mobile-friendly interface for repeat daily use

## Target audience

### Primary audience

Retail Bitcoin users who want a simple, reliable way to check the current Bitcoin market situation and use a small set of supporting tools.

### Secondary audience

- Bitcoin beginners who want an easier entry point than advanced trading platforms
- regular Bitcoin followers who want a cleaner overview than switching between multiple sources
- content consumers, hobby investors, and DCA users who check Bitcoin frequently but do not need portfolio software

### Expected usage patterns

Expected V1 usage is lightweight and recurring:

- users open the dashboard to check the latest BTC price, recent trend, network state, and sentiment
- users switch chart ranges and currency display for quick context
- users visit the tools area when they want to calculate DCA-related values
- users return multiple times per day or week rather than spending long continuous sessions in the app

## V1 goals

The first stable version must:

- provide a dependable Bitcoin overview page with current market, chart, network, and sentiment data
- include a working tools section with at least one complete utility: the DCA calculator
- work well on desktop and mobile without requiring authentication
- make core data understandable at a glance with low interaction cost
- be narrow in scope, with clear refusal of unrelated platform features

## V1 feature scope

### Dashboard overview

V1 includes a homepage that acts as the main entry point for the product. It must present the most relevant Bitcoin information in a way that is immediately useful without onboarding or configuration.

### Data cards

V1 dashboard data cards must cover the core snapshot metrics already supported by the app, including:

- BTC price
- 24h change
- market cap
- 24h volume
- 24h high and low
- latest block height
- recommended network fees

These cards should support quick scanning and basic state handling for loading, refresh, and unavailable data.

### Charting

V1 includes Bitcoin price chart views for short and medium-range inspection. The scope is:

- BTC-only chart data
- range switching for supported periods already in the product
- currency-aware chart display where supported by the dashboard
- simple trend reading, not advanced technical analysis

Charting is included to support overview and context, not deep trading workflows.

### Sentiment and network insights

V1 includes lightweight insight sections for:

- Bitcoin network status
- fee conditions
- market sentiment indicators such as Fear & Greed

These insights should help users interpret current conditions, but they are informational only and should not attempt to act as trading advice or predictive analytics.

### Tools section

V1 includes a dedicated tools area that organizes practical Bitcoin utilities separate from the main dashboard. For V1, this section does not need a broad tool catalog, but it must provide a stable home for included tools and make their scope obvious.

### DCA calculator

The DCA calculator is part of V1 and is the first fully supported tool. V1 scope for this tool includes:

- entering DCA purchase data
- calculating average buy price and related summary metrics
- using current BTC market data for context where applicable
- local, device-level persistence if available in the current implementation

The DCA calculator is a personal calculation tool, not a portfolio management system.

### Responsive behavior

V1 must be usable across modern desktop and mobile screen sizes. Responsive behavior in scope means:

- core dashboard information remains readable on mobile
- chart and card layouts adapt without breaking the information hierarchy
- tools pages remain usable without requiring desktop-only interactions

Responsive polish should prioritize clarity and function over animation or advanced layout behavior.

### Basic SEO expectations

V1 should meet basic discoverability and page-quality expectations, including:

- meaningful page titles and descriptions
- indexable public pages
- sensible semantic structure for main content
- no requirement for advanced content marketing or programmatic SEO

SEO in V1 is foundational, not a growth program.

## Non-goals for V1

The following are explicitly out of scope for V1:

- portfolio tracking
- user authentication or accounts
- watchlists
- alerts, push notifications, email notifications, or automation
- expansion into a multi-asset or general crypto platform
- admin dashboards or internal management systems

Features that mainly support retained user identity, long-term account state, or broad platform expansion should be treated as out of scope unless this document is updated.

## Success criteria

V1 is successful if all of the following are true:

- the dashboard clearly delivers Bitcoin market, chart, network, and sentiment overview in one place
- the tools area exists and the DCA calculator is complete and usable
- the application works reliably on common desktop and mobile sizes
- the feature set remains intentionally narrow and does not drift into portfolio, account, or multi-asset functionality
- a contributor can evaluate a proposed feature by asking whether it directly strengthens the Bitcoin overview or the small V1 toolset without expanding the product category

## Scope test for future tickets

A feature belongs in V1 only if it fits at least one of these conditions:

- it improves the Bitcoin dashboard overview already defined above
- it improves the DCA calculator or the small tools area without introducing account-based product complexity
- it improves usability, responsiveness, reliability, or baseline discoverability of the existing V1 feature set

A feature does not belong in V1 if it introduces:

- user-specific account systems
- ongoing tracking of holdings or portfolios
- proactive monitoring or alerting
- support for non-Bitcoin assets as a primary product direction
- operational back-office functionality outside the public product
