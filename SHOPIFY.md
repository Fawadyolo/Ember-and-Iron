# SHOPIFY.md — Commerce backend plan & integration notes

Plan and context for connecting the **Ember & Iron** storefront to **Shopify**,
plus the **Meta Pixel** setup. Companion to [`AGENTS.md`](./AGENTS.md) and
[`README.md`](./README.md). Read those for the app itself; this file is about the
commerce backend.

> **Status:** Not integrated yet. The storefront's commerce is still simulated
> (see `AGENTS.md` §7). This document is the agreed direction + setup steps.

---

## 1. Goal

Let **Shopify own the commerce** so that **inventory and orders appear in the
Shopify dashboard**, while keeping this custom front-end and its design.

The single principle that drives the whole design:

> **For orders + inventory to show in Shopify's dashboard, the checkout must
> happen *on Shopify*.**

The current custom checkout only saves orders to `localStorage` — Shopify never
sees them. So the final checkout step moves to Shopify; everything else (browsing,
cart UI, theme) stays custom.

---

## 2. Chosen approach: Headless (Storefront API)

| Stays custom (our domain) | Moves to Shopify |
|---------------------------|------------------|
| Product grid, PDPs, search, wishlist, recently-viewed | Final **checkout** (address, payment) |
| The cast-iron steel theme + all design | **Inventory** source of truth |
| The cart **drawer/UI** | **Orders** + customer records (in dashboard) |
| Bundles, promos shown pre-checkout | Payment processing (PCI handled by Shopify) |

Rejected alternatives:
- **Buy Button embed** — fastest, but replaces our custom cart/checkout UI with
  Shopify's. Good only if we abandon the custom flow.
- **Full Shopify theme (Liquid) / Hydrogen rebuild** — most "native" but a full
  rewrite; loses the single-file SPA.

---

## 3. What changes in the front-end (`index.html`)

When we integrate, the code changes are:

1. **Config block** near the top of the `<script>`:
   ```js
   const SHOPIFY_DOMAIN = 'your-store.myshopify.com';
   const SHOPIFY_STOREFRONT_TOKEN = 'xxxxxxxx'; // public Storefront token (browser-safe)
   ```
2. **Products/inventory** — replace the hard-coded `products` array with a live
   **Storefront API** GraphQL fetch (products, variants, prices, `availableForSale`).
   Keep the current array shape as a fallback for offline/demo.
3. **Cart** — keep the custom cart UI, but back it with Shopify's **Cart API**
   (`cartCreate` / `cartLinesAdd`), which returns a **`checkoutUrl`**.
4. **Checkout** — replace the custom checkout view's "Place order" with a
   redirect to Shopify's hosted `checkoutUrl`. This is what puts orders +
   inventory in the dashboard.

> ⚠️ This **replaces the custom checkout flow** (address form, promo-code field,
> COD/Easypaisa options, card validation) with Shopify's hosted checkout. The
> cart and all browsing stay ours. Promo codes would move to Shopify Discounts.

---

## 4. Setup you do in Shopify (only the store owner can)

1. Create the Shopify store; **add the products** there → this becomes the single
   source of truth for inventory (map them to our `EMB-###` SKUs).
2. **Settings → Apps and sales channels → Develop apps → Create an app** →
   configure **Storefront API** scopes → **install** → copy the
   **Storefront API access token**.
3. Note the store domain: `your-store.myshopify.com`.
4. Add **real prices** to the four grills (currently `PKR 0` placeholders).

---

## 5. Meta Pixel — two-part connection (same Pixel ID in both)

Because browsing is on our domain and checkout is on Shopify's, the pixel lives
in **both** places, tied together by one Pixel ID:

1. **On Shopify** (the money events): Shopify admin → **Settings → Apps →
   Facebook & Instagram** → connect Meta and **paste the Pixel ID**. This fires
   `InitiateCheckout` + `Purchase` on Shopify's checkout/thank-you pages and
   syncs the product catalog to Meta. **Enable the Conversions API** there too
   (server-side, iOS-resilient, dedupes with the browser pixel).
2. **On our custom site** (the browsing events): add the **base Meta Pixel** to
   `index.html` and fire `PageView`, `ViewContent` (PDP), and
   `AddToCart`. **Gate it behind the existing cookie-consent system** — only fire
   after `ember-cookie-consent === 'accept'` (hook into `initAnalytics()` /
   `trackPageView()`, which are currently console stubs).

To implement the site half, the only thing needed is the **Pixel ID**
(~15-digit number from Meta Events Manager).

---

## 6. Access & security (important)

- **Does the AI agent have access to the Shopify account? → No.** No store URL,
  login, or token has been provided, so nothing — not Claude, not the
  `shopify-dev-mcp` server — is connected to any real Shopify store. The agent
  cannot see or change products, orders, customers, or inventory.
- **Storefront API token** is *designed to be public* — it ships in browser/client
  code and is scoped to reading the storefront + building carts. Safe to place in
  the HTML. This is the only credential needed for the integration.
- **Admin API tokens / Shopify login are SECRET.** They are never needed in this
  front-end and must **never be pasted into a chat or committed to the file**.
  All admin-side work (connecting Meta, managing orders, discounts) is done in the
  Shopify admin UI by the owner.
- The **`shopify-dev-mcp`** tool (see §8) has **no account access** — it only
  reads public docs + API schemas.

---

## 7. Pakistan payment note

**Shopify Payments is not available in Pakistan**, so cards can't be taken through
Shopify directly. Options:
- A **third-party payment gateway** that Shopify supports, or
- **Manual payment methods** (Cash on Delivery, bank transfer, Easypaisa/JazzCash
  handled offline) — which matches the store's current COD/wallet setup.

Confirm the gateway before committing, since it affects the checkout experience.

---

## 8. Dev tooling: `shopify-dev-mcp` (already installed)

A Shopify **developer-docs MCP server** was added to Claude Code to make the
integration faster and less error-prone. It is **docs + schema only — not account
access.**

- **Added with:**
  ```bash
  claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest
  ```
  Stored in `~/.claude.json` (local config, project `/Users/fawadnasir/Projects`).
- **What it provides:** search Shopify dev docs, learn/introspect the
  **Storefront & Admin GraphQL schemas**, and validate GraphQL/theme code blocks.
  Tools: `search_docs_chunks`, `learn_shopify_api`, `validate_graphql_codeblocks`,
  `validate_theme`, `validate_component_codeblocks`.
- **What it is NOT:** it does **not** log into any store, holds no token, and
  cannot see products, orders, customers, or inventory.
- **Status: ✓ Connected (verified).** `claude mcp list` reports the server
  connected, and the `mcp__shopify-dev-mcp__*` tools are available
  (`learn_shopify_api`, `search_docs_chunks`, `validate_graphql_codeblocks`,
  `validate_component_codeblocks`, `validate_theme`). Package version `1.14.0`.
- **Requires Node.js** (it runs via `npx`). Node was **not installed** at first;
  installed **node v24.16.0 / npx 11.13.0** at `/usr/local/bin` (official macOS
  arm64 `.pkg`; system macOS 26.2, Apple Silicon).
- **Loads at session start** — if the `mcp__shopify-dev-mcp__*` tools aren't
  visible, start a fresh Claude Code session (or reconnect) to load them.
- **Gotcha (this actually happened during setup):** never run two
  `npx -y @shopify/dev-mcp@latest` at the same time. The server first showed
  "✗ Failed to connect" because a background warm-up and a foreground probe ran
  concurrently, **raced on the shared npx cache**, and left a dependency's JSON
  half-written — crashing the server at startup:
  `SyntaxError: …/tr46/lib/mappingTable.json: Expected ',' or ']' …`.
  **Fix:** `rm -rf ~/.npm/_npx && npm cache verify`, then run a **single** `npx`
  invocation. After that the MCP handshake succeeds and the health check is green.

---

## 9. Pre-launch checklist (independent of Shopify)

- [ ] Real **prices** on the four grills (EMB-001..004).
- [ ] **Host product images** at the URLs referenced in the JSON-LD.
- [ ] Replace the placeholder domain `emberandiron.pk` across the HTML,
      `sitemap.xml`, and `robots.txt`.
- [ ] Upload `robots.txt` + `sitemap.xml` to the domain root; submit the sitemap
      in Google Search Console.
- [ ] **SPA fallback** on the host (rewrite unknown paths → the HTML) so deep
      links like `/product/EMB-011` survive a hard refresh.

---

## 10. What's needed to start

| To do this | Provide |
|------------|---------|
| Wire the **Meta Pixel** (site half) | Your **Meta Pixel ID** |
| Wire **products / cart / checkout** | Your **`*.myshopify.com` domain** + **Storefront API token**, with products created in Shopify |

Until those exist, the storefront runs on its built-in demo data with simulated
checkout.
