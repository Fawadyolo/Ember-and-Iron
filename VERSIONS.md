# VERSIONS — Ember & Iron storefront

Version history for the storefront. See [`AGENTS.md`](./AGENTS.md) for how the
project works.

---

## Version 2 — *active development*
**File:** `index.html` (the live working file) + `product-images.js`,
`robots.txt`, `sitemap.xml`.

Built on top of Version 1. Changes:
- **Hero redesign** — reworked the landing‑page first view in the style of
  whiskit.com.pk's hero (punchy DTC composition), rendered in Ember & Iron's
  cast‑iron‑steel + ember‑fire identity:
  - Bold two‑beat headline **"Real Fire. / Real Flavour."** (Figtree 800; the
    second beat glows ember). Loaded Figtree weights 800/900 for the heavier cut.
  - Benefit eyebrow: "Hand‑built in Lahore · Free delivery over Rs 8,000".
  - Use‑case subline (Eid tikka, winter cookouts, camping, gatherings).
  - One prominent **fire‑coloured primary CTA "Shop grills"** + a subtle
    secondary "Browse accessories →" (mirrors whiskit's single bold "Shop Now").
  - Split layout kept (text left / featured product tile right, now with a soft
    shadow). Responsive on mobile.
- **Page-wide bold/punchy treatment** — carried the hero's energy across the site:
  - All section headings (`.module-head h2`, `.editorial h2`, bundle/PDP/footer
    titles) bumped to heavy weight 700–800 with tighter tracking and ember `<em>`.
  - Primary **purchase CTAs go fire-coloured** (hero "Shop grills", bundle
    "Add bundle to cart", PDP add-to-cart, cart "Proceed to checkout", "Place
    order"). Filled with **ember-deep** + white label text → **5.5:1 contrast
    (WCAG-AA pass)**; bright `--ember` is reserved for large display text only.
    Product-card "Add" buttons stay outline so the fire CTAs keep their impact.
- **Full-bleed video hero** — the landing‑page first view now plays a forge/fire
  video (whiskit‑style composition: text + CTA overlaid left, video as the whole
  visual + background, replacing the line‑art product tile):
  - Video: `hero-forge.mp4` (1280×720, ~10s loop, 3.3 MB) — copied from the
    supplied `i_want_you_to_make_the_hammeri (1).mp4` to a clean filename. **Must
    sit alongside `index.html`** for the relative `src` to resolve.
  - `<video autoplay muted loop playsinline>` + a JS `play()` fallback; pauses
    when scrolled well past the hero, resumes on return.
  - Dark left‑weighted gradient **scrim** keeps the cream/ember headline and
    sub legible over the footage; charcoal fallback background before load.
  - Note: muted‑autoplay works in real browsers; the automated preview
    environment blocks actual playback (shows a frame) — not a code issue.

---

## Version 1 — frozen snapshot ✅
**Archived in:** [`version-1/`](./version-1/) (self-contained & runnable:
`index.html` + `product-images.js` + `robots.txt` + `sitemap.xml`).
**Do not edit** — it's the baseline to compare/revert against.

What Version 1 includes (the complete front-end built so far):
- Cast-iron steel theme (single Figtree typeface, token-driven), aftwds-minimal layout
- Full storefront: product grid, PDPs, browsable accessories with filter + sort,
  bundles, search overlay
- Persistent cart, wishlist, recently-viewed (localStorage)
- Promo codes, stock indicators, star ratings, cart cross-sell
- Checkout with client-side validation (card Luhn/expiry/CVC) — **simulated** payment
- Guest order history + track-by-reference (no customer accounts)
- Policy/info pages, FAQ, contact; cookie consent + analytics stub
- SEO: keyword metadata + JSON-LD (Organization/Store, WebSite, 11 Products, FAQPage)
- Mobile hamburger nav, 404 page, accessibility (skip link, focus, back-to-top)
- Commerce is front-end **simulated**; production path is headless Shopify (`SHOPIFY.md`)

---

### How versions are labelled
- Each version's HTML carries a marker comment near the top
  (`<!-- … VERSION N … -->`).
- Version 1 is frozen in `version-1/`. Active edits happen on the root
  `index.html` (Version 2).
