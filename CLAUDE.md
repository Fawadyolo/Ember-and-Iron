# CLAUDE.md

> **Read [`AGENTS.md`](./AGENTS.md) first — it is the single source of truth**
> for this project (architecture, rules, conventions, gotchas). This file only
> adds Claude Code–specific notes. Do not duplicate content here; update
> `AGENTS.md` instead so every agent stays in sync.

## TL;DR
- **Ember & Iron** BBQ storefront. One self‑contained file: `index.html`
  (HTML + CSS + JS, ~240 KB). No build, no deps, vanilla everything.
- It's a client‑side SPA (`.view` divs + History API routing). Commerce is
  **simulated** (payment/orders/email/inventory are stubs).
- Theme = token‑driven "cast‑iron steel" (Figtree font). Never hard‑code colours.
- **Product image tiles must stay light (`--media`)** — see `AGENTS.md` §5.

## Companion docs
- [`AGENTS.md`](./AGENTS.md) — canonical agent guide ⭐
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — internal structure of the single file
- [`BRAND.md`](./BRAND.md) — catalog, voice, palette, SEO keywords
- [`SHOPIFY.md`](./SHOPIFY.md) — Shopify/headless plan, Meta Pixel, the
  `shopify-dev-mcp` dev tool, access/token safety, `npx` cache gotcha
- [`README.md`](./README.md) — overview + production path

## Claude Code working notes
- **The file is large.** Read in ranges (`offset`/`limit`); never read or paste
  it whole. Use `grep` to locate code before editing.
- **Prefer small, exact `Edit`s.** For repetitive changes across the repeated
  per‑view headers, a scripted edit is fine — but after any bulk/Python edit,
  **reload and check the browser console** (one stray syntax error blanks the app;
  the classic cause is a missing comma in the `products` array).
- **Verify in the preview, not by reading.** Serve over HTTP
  (`python3 -m http.server`) and open `…/index.html`. Use a
  cache‑buster (`?v=<timestamp>`) — the plain URL caches aggressively.
- **Don't reintroduce removed features** (customer accounts/login) unless asked.
- When changing the FAQ, update **both** the on‑page copy (`POLICY_PAGES.faq`)
  **and** the `FAQPage` JSON‑LD so they match.
- Keep the JSON‑LD valid; let a serializer handle escaping (product names contain
  `"`).
