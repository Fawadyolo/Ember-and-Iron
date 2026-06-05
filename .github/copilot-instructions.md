# GitHub Copilot instructions — Ember & Iron storefront

> The canonical guide is [`AGENTS.md`](../AGENTS.md). Read it first; this file is
> a short pointer so Copilot follows the same rules. Companion docs:
> [`ARCHITECTURE.md`](../ARCHITECTURE.md), [`BRAND.md`](../BRAND.md),
> [`README.md`](../README.md).

## Project in one line
**Ember & Iron** — a Pakistani BBQ‑grills storefront built as a **single,
dependency‑free HTML file** (`index.html`) containing all HTML, CSS,
and JS. No build, no framework, no npm.

## Rules Copilot must follow
1. **Vanilla only.** Suggest plain HTML/CSS/JS. Never introduce React/Vue, a
   bundler, npm packages, or a CSS framework.
2. **One file.** App code goes in `index.html`; image data lives in
   `product-images.js`. Nothing else.
3. **Client‑side SPA.** "Pages" are `.view` divs switched by `switchView()` with
   History‑API routing (`ROUTES`). No server‑side code.
4. **Use design tokens, not hex.** Colours come from the `:root` CSS custom
   properties (cast‑iron steel theme; Figtree font). See `AGENTS.md` §5.
5. **Keep product image tiles light** (`--media`) — dark line‑art and
   multiply‑blended photos vanish on a dark tile.
6. **Commerce is simulated** (payment/orders/email/inventory/analytics are stubs).
   Don't assume a backend; production target is headless Shopify.
7. **Don't regress** accessibility, WCAG‑AA contrast, or the JSON‑LD structured
   data. Keep the on‑page FAQ and `FAQPage` schema in sync.
8. **Guest‑only.** The account/login system was removed — don't bring it back
   unless asked.

## Gotchas
- The HTML is ~240 KB — make small, targeted edits.
- A single JS syntax error blanks the whole app; the usual culprit is a missing
  comma in the `products` array. Verify in a browser + console after changes.
- Product names contain `"` (e.g. `24" Collapsible Grill`) — escape in HTML
  attributes (`&quot;`) and JSON (`\"`).
- Serve over HTTP to test (History API + fetch need it); cache‑bust when
  re‑checking.
