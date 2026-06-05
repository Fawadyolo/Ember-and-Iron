# BRAND.md — Ember & Iron

Product, brand, and voice reference. Agents and copywriters should match this
when writing product descriptions, page copy, alt text, or marketing.

---

## The brand

**Ember & Iron** — hand‑built BBQ grills, smokers, charcoal and fire tools,
fabricated in a **Lahore, Pakistan** workshop. Premium, craft, built‑to‑last.

- **Tagline:** *"Fire, built for generations."*
- **Market:** Pakistan (Lahore, Karachi, Islamabad). Currency **PKR (Rs)**.
  Free delivery over Rs 8,000.
- **Positioning:** durable, hand‑welded, lifetime warranty on cookboxes —
  the opposite of disposable. Sold for real life: Eid, tikka nights, winter
  cookouts, camping, picnics, hosting and celebrations.

### Voice
Warm, confident, understated. Craft‑forward, not salesy. Short, concrete
sentences. Talk about fire, steel, smoke, and the people gathered around it.
Avoid hype words and exclamation marks. British/Pakistani English spelling
(e.g. "grilling", "favourite").

---

## Product catalog (11 SKUs)

IDs are `EMB-###`. **Grills** = main products; **Accessories** = everything else.

### Grills (`cat: 'grills'`) — *prices are placeholders (`PKR 0`) until set*
| ID | Name | Notes |
|----|------|-------|
| EMB-001 | 24" Collapsible Grill | Compact, folds flat. Camping/picnic/balcony. |
| EMB-002 | 30" Collapsible Grill | Larger; family BBQs, Eid tikka, winter. |
| EMB-003 | 24" Collapsible Grill with Grilling Top | Flat top for tikka, chicken, parathas. |
| EMB-004 | 30" Collapsible Grill with Grilling Top | All‑rounder for hosting/celebrations. |

### Accessories (`cat: 'accessories'`) — real PKR prices
| ID | Name | Price (Rs) |
|----|------|-----------:|
| EMB-010 | Lump Charcoal · 10kg | 4,200 |
| EMB-011 | Instant‑Read Meat Thermometer | 3,800 |
| EMB-013 | Fire Starter | 850 |
| EMB-015 | Basting Mop | 2,200 |
| EMB-016 | BBQ Grill Brush | 1,400 |
| EMB-018 | Handheld BBQ Air Blower | 3,200 *(out of stock)* |
| EMB-019 | Charcoal Bag · 5kg | 1,800 |

> Bundles (`packages`) combine a grill + accessories at a saving:
> The Starter, The Weekend, The Pitmaster, The Flagship.

---

## Visual identity

Single typeface **Figtree**. Look is **"cast‑iron steel"**: dark steel page,
light product "lightbox" tiles, glowing ember accents — like coals in the dark.

| Role | Token | Hex |
|------|-------|-----|
| Steel page | `--paper` | `#3A3D40` |
| Raised steel | `--paper-light` | `#44484C` |
| Light product tiles | `--media` | `#F3F0E8` |
| Text (light) | `--ink` | `#ECE7DD` |
| Charcoal (dark elements) | `--solid` | `#16110D` |
| Ember (primary accent) | `--ember` | `#E8571F` |
| Flame (small accent text) | `--flame` | `#FF9D5C` |
| Amber (highlight) | `--amber` | `#EE9A33` |

> Always reference tokens in code, never raw hex. Full table + contrast rules in
> [`AGENTS.md`](./AGENTS.md) §5.

---

## SEO keywords (target set)

Primary: **BBQ grills, charcoal, coal, smokers, grilling accessories**.
Use‑cases / long‑tail: **camping, outdoor cooking, picnic, adventure, festival,
Eid BBQ, chicken tikka, seekh kebab, koftas, celebrations, hosting, winter
cookouts, portable / collapsible grill, fire starter, lump charcoal**, all
**in Pakistan / Lahore / Karachi / Islamabad**.

Weave these into copy **naturally** — no stuffing. They already appear in: the
hero, the "Charcoal Grills for Every Occasion" section, product descriptions,
the FAQ, image alt text, meta tags, and the JSON‑LD. Keep on‑page FAQ copy in
sync with the `FAQPage` structured data.

---

## Contact (placeholders — replace with real details)

- Workshop: Walton Road, Lahore 54000, Pakistan
- Phone: +92 42 1234 5678 · WhatsApp: +92 300 1234 567
- Email: hello@emberandiron.pk · support@emberandiron.pk
- Domain placeholder: `emberandiron.pk` (used in canonical, OG, JSON‑LD, sitemap)
