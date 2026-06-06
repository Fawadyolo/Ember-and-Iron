# Ember & Iron — Storefront

A storefront for **Ember & Iron**, a Pakistani brand selling hand‑built BBQ
grills, smokers, charcoal and fire/grilling accessories.

Built as a **single, dependency‑free HTML file** — open it in a browser and it
just works. No build step, no framework, no npm.

> 🤖 **Working on this with an AI agent?** Read **[`AGENTS.md`](./AGENTS.md)** —
> it's the canonical guide for Claude, Cursor, Copilot, Windsurf, Aider, etc.

---

## Quick start

```bash
# Serve over HTTP (needed for fetch + History API routing — don't use file://)
python3 -m http.server 8000
# then open:
http://localhost:8000/index.html
```

That's it. No install, no compile.

---

## Deploy (get a live URL)

This is a static site — host it free anywhere. **It must be served at a domain
root** (`/`), because the app uses root‑absolute URLs for routing
(`/accessories`, `/product/EMB-011`).

**Netlify / Cloudflare Pages — recommended, cleanest:**
drag this folder onto <https://app.netlify.com/drop>, or connect the GitHub repo.
The included **`_redirects`** (`/* /index.html 200`) makes deep links and hard
refreshes work, with proper 200 responses. You get a root URL like
`ember-and-iron.netlify.app`.

**GitHub Pages:** works **only at the domain root** — i.e. with a **custom
domain** (e.g. `emberandiron.pk`) attached, or a user/org site repo
(`username.github.io`). A bare *project* page (`username.github.io/ember-and-iron/`)
serves under a sub‑path and will mis‑route this app. The included **`404.html`**
(a copy of `index.html`) is the deep‑link fallback Pages uses. **If you edit
`index.html`, regenerate it:** `cp index.html 404.html`.

> Custom domain (`emberandiron.pk`): point DNS at the host, then update the
> placeholder domain across `index.html` (canonical/OG/JSON‑LD), `sitemap.xml`
> and `robots.txt`.

---

## Project files

| File | What it is |
|------|------------|
| `index.html` | **The whole app** — HTML + CSS + JS in one file. |
| `product-images.js` | Base64 product photos, loaded `defer`. |
| `robots.txt` | Search‑crawler directives. |
| `sitemap.xml` | 22 indexable URLs. |
| `AGENTS.md` | Canonical instructions for AI agents. |
| `ARCHITECTURE.md` | Technical deep‑dive into the single‑file structure. |
| `BRAND.md` | Product catalog, brand voice, palette, SEO keywords. |
| `CLAUDE.md` / `.cursorrules` / `.github/copilot-instructions.md` | Agent‑specific pointers to `AGENTS.md`. |
| `*.backup-*.html` | Historical backups — don't edit or serve. |

---

## What it does

A complete storefront **front‑end**:

- Hero, product grid, bundles, editorial + "how to grill" + use‑case sections
- Product detail pages (PDP) with specs, ratings, related items
- Browsable accessories grid with filter + sort
- Persistent cart, wishlist, recently‑viewed (all survive reload)
- Search overlay, promo codes, stock indicators, star ratings
- Checkout with full client‑side validation (incl. card Luhn/expiry/CVC)
- Order history + track‑an‑order by reference (guest — no login)
- Policy/info pages, FAQ, contact form
- Cookie consent, SEO meta + JSON‑LD structured data, mobile hamburger nav,
  404 page, accessibility (skip link, focus rings, back‑to‑top)

**Theme:** "cast‑iron steel" — dark steel background, light product tiles,
ember‑orange accents, single Figtree typeface. All colours are CSS design tokens
(see `AGENTS.md` §5).

---

## ⚠️ Status: front‑end complete, commerce simulated

The buying experience is fully built, but the backend pieces are **placeholders**:

| Simulated | Reality |
|-----------|---------|
| Payment | `processCardPayment()` fakes success — no charge |
| Orders | saved to `localStorage`, not a database |
| Confirmation email | `console.log` only |
| Newsletter / contact | success toast only |
| Analytics | `console.log` stub (no GA/Meta Pixel yet) |
| Inventory | hard‑coded `stock`, doesn't decrement |

---

## Going to production

> 📘 **Full integration plan, setup steps, access/token safety, the installed
> `shopify-dev-mcp` dev tool, and Meta Pixel wiring live in
> [`SHOPIFY.md`](./SHOPIFY.md).**

**Recommended path: headless Shopify** — keep this custom front‑end, let Shopify
own the commerce so inventory + orders appear in the Shopify dashboard:

1. Create the Shopify store and add the products there.
2. Create a custom app → enable the **Storefront API** → copy the access token.
3. Wire the front‑end: fetch products/inventory from Shopify, build the cart via
   the Cart API, and **redirect the final checkout to Shopify's hosted checkout**
   (that's what puts orders in the dashboard).
4. **Meta Pixel** (two parts, same Pixel ID): connect it in Shopify's
   Facebook/Instagram channel (fires Checkout/Purchase on Shopify pages) **and**
   add the base pixel to this site for browsing events (gate it behind the
   existing cookie‑consent system).

Also before launch:
- Add **real prices** to the four grills (currently `PKR 0` placeholders).
- **Host the product images** at the URLs referenced in the JSON‑LD.
- Replace the placeholder domain `emberandiron.pk` across the HTML, `sitemap.xml`,
  and `robots.txt`.
- Upload `robots.txt` + `sitemap.xml` to the domain root and submit the sitemap
  in Google Search Console.
- Add an **SPA fallback** (rewrite unknown paths → the HTML) so deep links like
  `/product/EMB-011` survive a hard refresh.

---

## Tech

Vanilla **HTML + CSS + JavaScript**. Fonts: **Figtree** (Google Fonts). No
dependencies, no tooling. State via `localStorage`. Routing via the History API.
