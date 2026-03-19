# Information Architecture

## Purpose

This document defines the content hierarchy for V1 of the Bitcoin Dashboard.
It answers the question of **which content should appear where and with what level of priority**.

The IA is the foundation for:

- homepage layout
- module order
- mobile order
- navigation logic
- later visual redesign decisions

---

## 1. Core Principle

The homepage is not a collection point for every possible data point.
It is a focused overview of Bitcoin.

The page should first provide orientation,
then enable deeper exploration,
and only after that introduce supporting tools.

---

## 2. Main Areas of V1

V1 consists of five core content areas:

1. Market overview
2. Chart / price development
3. Sentiment / Fear & Greed
4. Network and blockchain data
5. Tools

---

## 3. Priority Levels

### Priority A — immediately visible / highest importance

- current Bitcoin price
- 24h change
- main chart

### Priority B — direct context

- market metrics
- sentiment / Fear & Greed

### Priority C — deeper factual context

- network data
- blockchain / on-chain related metrics

### Priority D — supporting functionality

- tool teaser
- DCA calculator

---

## 4. First 5 Seconds Rule

Within the first 5 seconds, the following should be clear:

- What is Bitcoin currently trading at?
- How has the price changed recently?
- What does the main chart look like?
- What is the current sentiment / market mood?
- Where can I access the tools?

Anything that gets in the way of this should be treated as lower priority.

---

## 5. Homepage Structure

## 5.1 Hero / Page Intro

Goal:

- make it immediately clear what the page is about
- avoid marketing overload
- no need for a large landing-page style hero with too much copy

Content:

- clear page title
- optional short subtitle
- optional last-updated timestamp
- optional small context about data freshness

Note:
The hero should provide orientation, not dominate the page visually.

---

## 5.2 Primary Overview Zone

Goal:

- most important information area on the entire page

Content:

- current Bitcoin price
- 24h change
- optional 24h high / 24h low
- optional 1–2 additional core KPIs

Requirements:

- extremely scannable
- clear number hierarchy
- trend and status visible at a glance

---

## 5.3 Main Chart Zone

Goal:

- price development as the main exploration area

Content:

- main chart
- timeframe switching
- optional last refresh / data status
- optional compact chart context information

Requirements:

- visually prominent
- above deeper secondary sections
- readable on mobile
- not overloaded like a trading terminal

---

## 5.4 Market Context Zone

Goal:

- place the current price into a broader market context

Possible content:

- market cap
- volume
- dominance (if within scope)
- additional compact market metrics

Requirements:

- secondary to price + chart
- compact, but not cramped
- same visual language as overview

---

## 5.5 Sentiment Zone

Goal:

- provide a fast emotional / psychological market reading

Content:

- Fear & Greed
- short status / label
- optional last-updated info

Requirements:

- very fast to understand
- can be slightly more visually expressive than other sections
- must not become a showpiece

---

## 5.6 Network & Blockchain Zone

Goal:

- provide deeper technical context for more advanced users

Possible content:

- network data
- blockchain size
- additional blockchain-related metrics

Requirements:

- informative, but clearly secondary
- not visually equal in importance to price + chart
- modular and extendable

---

## 5.7 Tools Zone

Goal:

- create the transition from information to interaction

V1 content:

- DCA calculator
- optional tool teaser / CTA to the tools page

Requirements:

- clearly accessible
- visible on the homepage
- but not positioned as the main stage above core data

---

## 6. Desktop Order

Recommended order on desktop:

1. Header / navigation
2. Intro / page context
3. Primary Overview Zone
4. Main Chart Zone
5. Market Context + Sentiment
6. Network & Blockchain
7. Tools Preview / CTA
8. Footer

---

## 7. Mobile Order

Recommended order on mobile:

1. Header
2. Intro
3. Price + 24h + core KPIs
4. Main chart
5. Sentiment
6. Market metrics
7. Network / blockchain
8. Tools
9. Footer

Reasoning:
On mobile, fast comprehension must come first.
Deeper context and tools follow afterwards.

---

## 8. Navigation Logic

V1 navigation should remain light and clear.

Recommended main items:

- Dashboard
- Tools

Optional later:

- Learn / Info
- About / Methodology
- Settings

Not a V1 priority:

- Portfolio
- Alerts
- Watchlist
- Multi-coin navigation

---

## 9. Content Rules

### 9.1 What belongs on the homepage

- everything that helps explain the current Bitcoin situation quickly
- everything that supports the core product promise
- selected teasers for supporting tools

### 9.2 What does not belong on the homepage

- feature collections without priority
- deep configuration options
- too many equally weighted KPI cards
- experimental side features
- UI elements without clear information value

---

## 10. Module Principles

Every homepage module should:

- have a clear purpose
- fit into the priority logic
- be understandable within 1–2 seconds
- have consistent states
- not force special layout logic

---

## 11. Information Density

The page should be informative, but must not feel overloaded.

Therefore:

- prefer fewer modules with clearer weighting
- prefer stronger visual grouping
- prefer more breathing room between sections
- prefer clear overview over maximum data density

---

## 12. Success Criteria for the IA

The information architecture is successful if a new user can say after a few seconds:

- This is a Bitcoin-focused site
- I can immediately see price and direction
- I roughly understand the market situation
- I can find deeper metrics if I want to
- I can use tools without the page feeling overcrowded
