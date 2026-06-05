# ARCHITECTURE

Technical reference for `index.html`. For working rules and
conventions see [`AGENTS.md`](./AGENTS.md); this document explains **how the
single file is structured internally**.

---

## 1. Single‑file layout

Everything is in `index.html`, in this order:

```
<head>
  meta + SEO (title, description, keywords, robots, geo, Open Graph, Twitter)
  JSON-LD structured data  (one <script type="application/ld+json">)
  <link> Figtree font
  <script defer src="product-images.js">   → window.PRODUCT_IMAGES
  <style> … all CSS …
</head>
<body>
  shared chrome: mobile nav drawer, skip link
  one <div class="view"> per "page"
  overlays: cart drawer, search overlay, toast, cookie banner, back-to-top, 404
  <script> … all JS …
</body>
```

`product-images.js` is the only external asset (≈150 KB of base64 photos), split
out and `defer`‑loaded so first paint isn't blocked. The grids re‑render on
`DOMContentLoaded` once it's available, swapping placeholder SVG line‑art for
real photos.

---

## 2. View / "router" model (client‑side SPA)

There is **no server router**. Each "page" is a `<div class="view" id="view-…">`.
Only one has `.active` at a time (CSS shows `.view.active`, hides the rest).

- **`switchView(id, opts)`** — removes `.active` from all views, adds it to the
  target, scrolls to top, fires `trackPageView()`, and (unless `opts.skipRoute`)
  calls `pushRoute()`.
- **`ROUTES`** — maps view ids → URL paths:
  `/`, `/accessories`, `/wishlist`, `/checkout`, `/order-confirmed`, `/orders`,
  plus dynamic `/product/<id>` and policy slugs (`/faq`, `/contact`, `/privacy`…).
- **`pushRoute(viewId, slug)`** — `history.pushState` to the mapped path.
- **`viewFromPath(path)`** — reverse lookup; unknown non‑root paths → `view-404`.
- **`initRouter()`** — on load, resolves the current URL to a view; binds
  `popstate` so browser Back/Forward work; `applyRouteContent()` re‑renders
  dynamic views (PDP, policy) when navigated to directly.

Views present: `view-shop`, `view-accessories`, `view-wishlist`, `view-policy`
(shared shell for all info pages), `view-product` (PDP), `view-orders`,
`view-order-detail`, `view-checkout`, `view-success`, `view-404`.

> Each view contains its **own `<header>`** (logo, nav, search/wishlist/cart,
> hamburger). Header changes must be replicated across every view + the mobile
> drawer.

---

## 3. Data model

```js
// Master catalog
const products = [
  { id:'EMB-001', name:'24" Collapsible Grill', cat:'grills',
    desc:'…', price:0, tag:'', art:'portable', stock:12,
    rating:4.7, reviewCount:42 },
  // … 11 products total: grills EMB-001..004, accessories EMB-010..019
];

const featuredGrillIds = ['EMB-001','EMB-002','EMB-003','EMB-004'];
const packages = [ /* bundles: grillId + accessoryIds + pricing */ ];
const POLICY_PAGES = { shipping, returns, warranty, care, privacy, terms,
                       about, faq, contact };  // {eyebrow, title, body(HTML)}
const PROMO_CODES = { EMBER10, WELCOME5, BBQ500 };
```

- `cat` is one of two values: `'grills'` or `'accessories'`.
- `art` selects a hand‑drawn SVG from `artSvg(type)` (used when no real photo).
- `tag` is `''` or `'new'`.
- Grills currently have `price: 0` (placeholders); accessories have real PKR
  prices.

---

## 4. Rendering pipeline

- **`mediaFor(item, opts)`** — returns a real `<img>` (if `PRODUCT_IMAGES[id]`
  exists) else the SVG line‑art from `artSvg(item.art)`. Adds keyword‑rich,
  quote‑safe `alt` / `aria-label`.
- **`productCardHtml(p, idPrefix)`** — the **single shared card template**:
  image tile + wishlist heart + meta + name + rating + description + stock
  indicator + price + qty stepper + add‑to‑cart. Sold‑out variant disables the
  controls.
- Consumers: `renderProducts()` (featured grills), `renderAccessories()`
  (filter/sort aware), `renderWishlist()`, and the PDP "related" grid.
- **`renderProduct(p)`** builds the PDP; **`renderCheckoutSummary()`**,
  **`renderOrders()`**, **`renderSuggestions()`** (cart cross‑sell),
  **`renderRecentlyViewed()`** build their respective surfaces.

Init order at the bottom of the script:
`loadWishlist → loadRecent → renderProducts → renderPackages → renderAccessories
→ loadCart → updateCartUI → updateWishlistUI → renderRecentlyViewed →
setupValidationListeners → attachCardFormatters → showCookieBannerIfNeeded →
initRouter → back‑to‑top listener`, then a `DOMContentLoaded` re‑render once
photos load.

---

## 5. State & persistence

All client‑side, via `localStorage` (helpers `saveCart`/`loadCart`, etc.):

| Key | Contents | Notes |
|-----|----------|-------|
| `ember-cart-v1` | `{ id: {…item, qty} }` | restored on load; prunes removed SKUs |
| `ember-wishlist-v1` | `[id, …]` | header "Saved" badge |
| `ember-recent-v1` | `[id, …]` (max 8) | tracked on PDP view + add‑to‑cart |
| `ember-orders-v1` | `[order, …]` | guest order history; tracked by reference |
| `ember-cookie-consent` | `'accept'` \| `'decline'` | gates analytics stub |

In‑memory globals: `cart`, `wishlist` (Set), `recentlyViewed`, `appliedPromo`,
`cardQty`, plus search/filter state.

> **Guest‑only:** the customer‑account/login system was removed. There is no
> `currentUser`, no `ember-users-v1`, no `/account` view. Orders are identified
> by reference number + the email entered at checkout.

---

## 6. CSS cascade layers (theme)

All CSS is in one `<style>`, authored as ordered layers; **later wins**:

1. **Base** — `:root` tokens + original component styles.
2. **AFTWDS THEME LAYER** — single‑font (Figtree) minimal look, rounded media,
   gapped/borderless cards, light‑weight headings.
3. **CAST‑IRON STEEL THEME** — dark steel page, light text, and the rule that
   keeps **product image tiles light** (`--media`) so dark line‑art and
   multiply‑blended photos stay visible.
4. **Steel contrast tuning** — introduces `--flame` for small accent text so it
   meets WCAG‑AA on the dark background; deep‑ember for accents on light tiles.

See `AGENTS.md` §5 for the full token table and contrast rules. Responsive
breakpoints: **≤900px** (hamburger nav, stacked layouts) and **≤540px**
(single‑column grids).

---

## 7. SEO & structured data

- `<head>` meta: keyword‑rich title/description/keywords, robots, geo, Open
  Graph, Twitter, canonical, theme‑color, inline SVG favicon.
- **JSON‑LD `@graph`** (must stay valid — powers rich results):
  `Organization`+`Store`, `WebSite` (with `SearchAction`),
  `ItemList` of all 11 `Product`s (brand, sku, `aggregateRating`, and `Offer`
  for priced items), and `FAQPage`.
- The on‑page FAQ (`POLICY_PAGES.faq`) **must match** the `FAQPage` schema — edit
  both together.
- `sitemap.xml` + `robots.txt` live beside the HTML.

---

## 8. Known constraints

- **Deep‑link reload** needs an SPA fallback on the host (rewrite unknown paths →
  the HTML); the local `python http.server` returns 404 for them.
- **Browser caching** of the plain URL is aggressive — cache‑bust when verifying.
- **One JS syntax error blanks the page** — always check the console after edits,
  especially scripted/bulk edits to the `products` array or JSON‑LD.
- Product names contain `"` — escape correctly in HTML attributes (`&quot;`) and
  JSON (`\"`).
