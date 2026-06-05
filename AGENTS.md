# AGENTS.md

> **Canonical instructions for any AI coding agent** working on this project
> (Claude Code, Cursor, GitHub Copilot, Windsurf, Aider, Gemini, etc.).
> `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md` all point here.
> Keep this file as the single source of truth.

---

## 1. What this project is

**Ember & Iron** — an e‑commerce storefront for a Pakistani brand that sells
hand‑built BBQ grills, smokers, charcoal and fire/grilling accessories.

It is a **single self‑contained HTML file** with **no build step, no framework,
and no dependencies**. Everything (markup, CSS, JavaScript) lives in one file and
runs directly in the browser.

| File | Purpose |
|------|---------|
| `index.html` | **The entire app** — HTML + CSS + JS in one file. This is what you edit. |
| `product-images.js` | Base64 product photos, loaded `defer` (kept out of the HTML for performance). Sets `window.PRODUCT_IMAGES`. |
| `robots.txt` | Crawler directives. |
| `sitemap.xml` | 22 indexable URLs for SEO. |
| `version-1/` (folder) | Frozen Version 1 snapshot, runnable. **Do not edit.** |

> ⚠️ The main HTML is **~240 KB**. Read it in ranges; never paste the whole thing.

---

## 2. Golden rules (read before editing)

1. **Vanilla only.** No npm, no bundler, no React/Vue, no CSS framework. Plain
   HTML/CSS/JS. If you think you need a dependency, you almost certainly don't.
2. **One file.** All app code goes in `index.html`. The only exception
   is `product-images.js` (image data).
3. **It's a client‑side SPA.** "Pages" are `.view` divs toggled by `switchView()`,
   with real URLs via the History API. There is **no server/router**.
4. **Commerce is currently simulated.** Payments, orders, email, inventory and
   analytics are front‑end stubs (see §7). Treat them as placeholders; the
   intended production path is **headless Shopify** (see `README.md`).
5. **The theme is token‑driven.** Never hard‑code colours — use the CSS custom
   properties in `:root` (see §5). Adding a hard‑coded hex is a bug.
6. **Light product tiles are mandatory.** The page is dark steel, but product
   image frames MUST stay light (`--media`) — the line‑art is drawn in dark ink
   and real photos use `mix-blend-mode: multiply`, both of which need a light
   backdrop. See §5.
7. **Preserve accessibility & SEO.** Keyboard focus, alt text, ARIA, the JSON‑LD
   structured data, and WCAG‑AA contrast are all in place. Don't regress them.
8. **Verify visually.** After a change, serve the file and check it in a browser
   (see §6). Don't assume CSS/JS changes are correct by reading alone.

---

## 3. High‑level architecture

```
index.html
├── <head>
│   ├── SEO meta (title, description, keywords, robots, OG, Twitter, geo)
│   ├── JSON‑LD structured data (Organization/Store, WebSite, ItemList of
│   │   Products, FAQPage)  ← keep valid; it powers Google rich results
│   ├── Figtree font (Google Fonts) + deferred product-images.js
│   └── <style>  … all CSS, in cascade layers (see §5) …
├── <body>
│   ├── mobile nav drawer + skip link
│   ├── .view#view-shop  (home: hero, products, bundles, editorial, how‑to,
│   │   occasions SEO block, footer)  — wrapped in <main id="main-content">
│   ├── .view#view-accessories
│   ├── .view#view-wishlist
│   ├── .view#view-policy        (shared shell for all info pages)
│   ├── .view#view-product       (PDP, rendered dynamically)
│   ├── .view#view-orders / #view-order-detail
│   ├── .view#view-checkout / #view-success
│   ├── .view#view-404
│   ├── cart drawer, search overlay, toast, cookie banner, back‑to‑top
│   └── <script>  … all JS …
```

**Data model** — a `products` array of objects:
```js
{ id:'EMB-001', name:'24" Collapsible Grill', cat:'grills'|'accessories',
  desc:'…', price:0, tag:''|'new', art:'portable', stock:12,
  rating:4.7, reviewCount:42 }
```
Plus a `packages` array (bundles) and `POLICY_PAGES` (info/legal/FAQ/contact copy).

**Rendering** — `productCardHtml(p, idPrefix)` is the shared card template used by
`renderProducts()` (featured grills), `renderAccessories()`, wishlist, and PDP
related items. Change the card once, it updates everywhere.

**Routing** — `ROUTES` maps view ids → paths (`/`, `/accessories`, `/wishlist`,
`/checkout`, `/order-confirmed`, `/orders`, `/product/<id>`, policy slugs).
`switchView(id, opts)` swaps the active view and `pushRoute`s; `initRouter()`
handles deep links + `popstate` (Back/Forward). Unknown paths → `view-404`.

**State (localStorage)** — persisted across reloads:
| Key | Holds |
|-----|-------|
| `ember-cart-v1` | cart contents |
| `ember-wishlist-v1` | saved product ids |
| `ember-recent-v1` | recently‑viewed ids (max 8) |
| `ember-orders-v1` | placed orders (guest) |
| `ember-cookie-consent` | `accept` / `decline` |

> The site is **guest‑only** — the customer‑account/login system was removed.
> Order history works by reading `ember-orders-v1`; customers track orders by
> reference number. Do not reintroduce accounts unless asked.

---

## 4. Feature inventory (what already exists — don't rebuild)

Cart (persisted) · product detail pages · browsable accessories grid with
filter + sort · quantity steppers · wishlist + recently‑viewed · cart cross‑sell
("you might also like") · promo/discount codes (`EMBER10`, `WELCOME5`, `BBQ500`)
· stock/availability indicators · star ratings · search overlay · bundles ·
checkout with client‑side validation + card Luhn/expiry/CVC checks (simulated
payment) · order history + track‑by‑reference · policy/info pages + FAQ + contact
· cookie consent + analytics stub · SEO (meta + JSON‑LD) · mobile hamburger nav ·
404 page · accessibility (skip link, focus rings, back‑to‑top).

---

## 5. The CSS / theme system (important)

The current look is **"cast‑iron steel"** — a dark steel page with light product
"lightbox" tiles and glowing ember accents. Single typeface: **Figtree**.

CSS is layered inside one `<style>`; **later layers override earlier ones**, so
edit the *right* layer:

1. **Base styles** — original component CSS.
2. **AFTWDS THEME LAYER** — minimal single‑font look, rounded media, gapped cards.
3. **CAST‑IRON STEEL THEME** — dark page, light text, light media tiles.
4. **Contrast tuning** — small‑accent text uses `--flame` so it passes WCAG‑AA.

### Design tokens (in `:root`) — always use these, never raw hex
| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#3A3D40` | steel page background |
| `--paper-light` | `#44484C` | raised steel surfaces (cards, inputs, summary) |
| `--media` | `#F3F0E8` | **light tiles for product art/photos** (mandatory) |
| `--ink` | `#ECE7DD` | primary text (light) |
| `--ink-soft` / `--muted` / `--muted-soft` | light greys | secondary text |
| `--solid` | `#16110D` | charcoal — solid dark buttons/elements |
| `--on-dark` | `#F4EFE6` | light text on dark elements |
| `--ember` | `#E8571F` | primary ember accent (large text, icons) |
| `--flame` | `#FF9D5C` | brighter accent for **small** text (contrast‑safe) |
| `--amber` | `#EE9A33` | warm highlight |
| `--ember-deep` | `#BB3D12` | accent on light media tiles |
| `--forest` | `#16110D` | charcoal slabs (announce bar, editorial, footer accents) |
| `--line` / `--line-strong` | white @ low alpha | borders on steel |

### Contrast rule
- Page background is dark → most text is light (`--ink`).
- **Small accent text** (low‑stock, "Free", savings, ratings, step labels) must
  use `--flame`, not `--ember`/`--ember-deep` (those fail AA at small sizes).
- Accent text **on light media tiles** uses `--ember-deep` (dark enough to read).
- If you add coloured text, mentally check ≥ 4.5:1 (normal) / 3:1 (large) against
  its real background.

---

## 6. How to run / preview

No build. Serve the folder over HTTP (don't `file://` it — fetch/History need a
server) and open the HTML:

```bash
cd <project folder>
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

**Verification checklist after any change:**
- Open the page; check the **browser console for errors** (a single JS syntax
  error blanks the whole app — see §8).
- Click through: product card → PDP → add to cart → cart drawer → checkout →
  place order → success → order history.
- Test mobile width (≤ 900px shows the hamburger menu).
- If you touched colours, eyeball contrast on dark surfaces.

> **Cache gotcha:** browsers aggressively cache the plain URL. When re‑checking,
> hard‑reload or append a cache‑buster (`?v=<timestamp>`).

---

## 7. Simulated backend (placeholders — know the boundary)

These **look** real but do nothing server‑side:
- **Payment** — `processCardPayment()` resolves a fake success. No charge.
- **Orders** — saved to `localStorage`, not a database.
- **Confirmation email** — `sendOrderEmail()` `console.log`s the receipt.
- **Newsletter / contact form** — show a success toast; nothing is sent.
- **Analytics** — `trackPageView()` `console.log`s; no real GA/Pixel yet.
- **Inventory** — `stock` is hard‑coded and does not decrement.

**Production direction:** headless **Shopify** (Storefront API for products +
inventory, Shopify‑hosted checkout so orders/inventory appear in the Shopify
dashboard) and a **Meta Pixel**. **Full plan + setup, access/token safety, the
installed `shopify-dev-mcp` dev tool, and the `npx` cache gotcha are documented in
[`SHOPIFY.md`](./SHOPIFY.md).** See also `README.md` → "Going to production".

---

## 8. Conventions & gotchas (learn from past pain)

- **Editing the giant file:** prefer small, exact find‑and‑replace edits. When
  doing bulk/scripted edits (e.g. Python), **double‑check delimiters** — a missing
  comma after a `products` object property (`art: 'x'` then `stock: 12` with no
  comma) silently breaks the whole `<script>` and blanks the page. After scripted
  edits, reload and check the console.
- **Don't double‑escape JSON‑LD.** When regenerating the structured‑data block,
  let the JSON serializer handle escaping; don't post‑process backslashes. Product
  names contain `"` (e.g. `24" Collapsible Grill`) which must be `\"` in JSON and
  `&quot;`/escaped in HTML attributes.
- **Product IDs** are `EMB-###`. Grills: 001–004 (currently `price: 0`,
  placeholders awaiting real prices). Accessories: 010–019.
- **One render template:** edit `productCardHtml()` rather than copying card markup.
- **Headers repeat:** each `.view` has its own `<header>`. A header/nav change must
  be applied to all of them (and the mobile drawer).
- **Currency:** PKR, formatted via `fmt()` (`toLocaleString('en-PK')`).
- **Backups:** the `*.backup-*.html` files are history — never edit or serve them.

---

## 9. Definition of done

- [ ] Change implemented in `index.html` (vanilla, token‑based).
- [ ] No new browser‑console errors.
- [ ] Core flow still works (browse → cart → checkout → success → orders).
- [ ] Responsive (desktop + ≤900px mobile) still correct.
- [ ] Contrast / accessibility / SEO structured data not regressed.
- [ ] If you added a route/view, it's in `ROUTES` and reachable + has a way back.
