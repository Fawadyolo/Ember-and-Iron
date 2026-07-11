
window.PRODUCT_IMAGES = window.PRODUCT_IMAGES || {};

// ===== Product data =====
const products = [
  {
    id: 'EMB-001',
    name: '24" Collapsible Grill',
    cat: 'grills',
    desc: 'Compact 24-inch charcoal grill that folds flat for transport and storage.',
    price: 0,
    tag: '',
    art: 'portable',
    stock: 12,
    rating: 4.7,
    reviewCount: 42
  },
  {
    id: 'EMB-002',
    name: '30" Collapsible Grill',
    cat: 'grills',
    desc: 'Larger 30-inch charcoal grill that folds flat for transport and storage.',
    price: 0,
    tag: '',
    art: 'portable',
    stock: 8,
    rating: 4.8,
    reviewCount: 31
  },
  {
    id: 'EMB-003',
    name: '24" Collapsible Grill with Grilling Top',
    cat: 'grills',
    desc: 'Foldable 24-inch grill with a flat grilling top for more cooking surface.',
    price: 0,
    tag: '',
    art: 'tabletop',
    stock: 15,
    rating: 4.6,
    reviewCount: 18
  },
  {
    id: 'EMB-004',
    name: '30" Collapsible Grill with Grilling Top',
    cat: 'grills',
    desc: 'Foldable 30-inch grill with a flat grilling top for more cooking surface.',
    price: 0,
    tag: '',
    art: 'tabletop',
    stock: 6,
    rating: 4.9,
    reviewCount: 24
  },
  {
    id: 'EMB-010',
    name: 'Lump Charcoal · 10kg',
    cat: 'accessories',
    desc: 'Single-origin acacia lump charcoal. Slow, clean burn.',
    price: 4200,
    tag: '',
    art: 'fuel',
    stock: 50,
    rating: 4.5,
    reviewCount: 87
  },
  {
    id: 'EMB-011',
    name: 'Instant-Read Meat Thermometer',
    cat: 'accessories',
    desc: 'Digital instant-read probe thermometer with backlit display.',
    price: 3800,
    tag: 'new',
    art: 'thermometer',
    stock: 3,
    rating: 4.8,
    reviewCount: 65
  },
  {
    id: 'EMB-013',
    name: 'Fire Starter',
    cat: 'accessories',
    desc: 'Natural wood-wool and wax fire-starter cubes.',
    price: 850,
    tag: '',
    art: 'firestarter',
    stock: 100,
    rating: 4.4,
    reviewCount: 112
  },
  {
    id: 'EMB-016',
    name: 'BBQ Grill Brush',
    cat: 'accessories',
    desc: 'Brass-bristle grill brush with a built-in scraper.',
    price: 1400,
    tag: '',
    art: 'grillbrush',
    stock: 15,
    rating: 4.6,
    reviewCount: 53
  },
  {
    id: 'EMB-018',
    name: 'Handheld BBQ Air Blower',
    cat: 'accessories',
    desc: 'Battery-powered handheld blower for fast coal ignition.',
    price: 3200,
    tag: 'new',
    art: 'blower',
    stock: 0,
    rating: 4.7,
    reviewCount: 28
  },
  {
    id: 'EMB-019',
    name: 'Charcoal Bag · 5kg',
    cat: 'accessories',
    desc: 'Hardwood charcoal in a resealable kraft bag.',
    price: 1800,
    tag: '',
    art: 'charcoalbag',
    stock: 40,
    rating: 4.5,
    reviewCount: 94
  },
  {
    id: 'EMB-020',
    name: 'Brass Cleaning Brush',
    cat: 'accessories',
    desc: 'Solid brass-bristle brush for deep-cleaning grates, burners and cast iron.',
    price: 0,
    tag: 'new',
    art: 'brassbrush',
    stock: 25,
    rating: 4.7,
    reviewCount: 14
  }
];

// ===== Shopify Storefront API =====
const SHOPIFY_DOMAIN = 't9qx0t-69.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = 'e80c114f34e2640d4af7dce00b11ebb8';
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`;

// Shopify variant IDs keyed by our SKU (e.g. 'EMB-001' -> 'gid://shopify/ProductVariant/xxx')
// Populated after loadShopifyProducts() runs
const shopifyVariantIds = {};

// Baked Shopify URL handles so product links are crawlable in the static HTML
// (real SEO hrefs before/without the live sync; sync keeps them fresh via p.handle)
const PRODUCT_HANDLES = {
  'EMB-001': '24-collapsible-grill',
  'EMB-002': '30-collapsible-grill',
  'EMB-003': '24-collapsible-grill-with-grilling-top',
  'EMB-004': '30-collapsible-grill-with-grilling-top',
  'EMB-010': 'lump-charcoal-10kg',
  'EMB-011': 'instant-read-meat-thermometer',
  'EMB-013': 'fire-starter',
  'EMB-016': 'bbq-grill-brush',
  'EMB-018': 'handheld-bbq-air-blower',
  'EMB-019': 'charcoal-bag-5kg',
  'EMB-020': 'brass-cleaning-brush'
};
function productUrl(p) {
  const h = p && (p.handle || PRODUCT_HANDLES[p.id]);
  return h ? '/products/' + h : '/product/' + (p && p.id);
}

async function shopifyFetch(query, variables) {
  try {
    const res = await fetch(SHOPIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  } catch (e) {
    console.warn('[Shopify]', e.message);
    return null;
  }
}

async function loadShopifyProducts() {
  const data = await shopifyFetch(
    `query GetProducts($first: Int!) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          description
          productType
          featuredImage { url }
          variants(first: 5) {
            nodes {
              id
              sku
              price { amount currencyCode }
              availableForSale
              quantityAvailable
            }
          }
        }
      }
    }`,
    { first: 50 }
  );

  // Baked product-photo fallbacks (current Shopify CDN URLs). Used until the
  // Storefront API token is granted media access; the live featuredImage below
  // then takes over automatically, keeping photos in sync with Shopify.
  const BAKED_IMAGES = {
    'EMB-010': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/9228085797105354232_677cdeaf-91f3-4c16-8044-0c16a4dc661f.jpg?v=1780958038',
    'EMB-011': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/zeeshan-local-electronics-kitchen-home-appliances-kitchen-appliances-digital-meat-thermometer-7054415593601_1024x_5d989b00-417c-447a-89f8-45e366c4a8cd.webp?v=1780957836',
    'EMB-016': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/images.jpg?v=1780957407',
    'EMB-018': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/download_5.jpg?v=1780957074',
    'EMB-019': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/9228085797105354232.jpg?v=1780953269',
    'EMB-020': 'https://cdn.shopify.com/s/files/1/0832/3498/0059/files/image.avif?v=1780952257'
  };
  window.PRODUCT_IMAGES = window.PRODUCT_IMAGES || {};
  Object.keys(BAKED_IMAGES).forEach(function (sku) {
    if (!window.PRODUCT_IMAGES[sku]) window.PRODUCT_IMAGES[sku] = BAKED_IMAGES[sku];
  });

  if (!data || !data.products || !data.products.nodes.length) {
    console.info('[Shopify] No products found - running on demo data');
    renderProducts(); renderAccessories(); renderPackages();
    return;
  }

  const typeToCat = function (t) {
    return (t || '').toLowerCase().indexOf('grill') !== -1 ? 'grills' : 'accessories';
  };
  const shortDesc = function (txt) {
    if (!txt) return '';
    const clean = txt.replace(/\s+/g, ' ').trim();
    if (clean.length <= 150) return clean;
    const cut = clean.slice(0, 150);
    const dot = cut.lastIndexOf('. ');
    return dot > 60 ? cut.slice(0, dot + 1) : cut.trim() + '…';
  };

  data.products.nodes.forEach(function (sp) {
    const v = sp.variants.nodes.find(function (x) { return x.sku; }) || sp.variants.nodes[0];
    if (!v || !v.sku) return;
    const sku = v.sku;
    shopifyVariantIds[sku] = v.id;

    const price = Math.round(parseFloat(v.price.amount));
    const stock = v.availableForSale ? (v.quantityAvailable != null ? v.quantityAvailable : 0) : 0;
    const liveImg = sp.featuredImage && sp.featuredImage.url;
    if (liveImg) window.PRODUCT_IMAGES[sku] = liveImg;   // live Shopify photo wins when available

    // Bundle products (PKG-###) belong to `packages`, not the product grids.
    // Shopify owns the bundle price once synced — checkout always matches display.
    const pkgLocal = packages.find(function (k) { return k.id === sku; });
    if (pkgLocal) {
      if (price > 0) { pkgLocal.price = price; pkgLocal.shopifyPriced = true; }
      pkgLocal.handle = sp.handle;
      return;
    }

    const local = products.find(function (p) { return p.id === sku; });
    if (local) {
      if (sp.title) local.name = sp.title;
      local.handle = sp.handle;
      if (price > 0) local.price = price;
      local.stock = stock;
      if (sp.description) local.desc = shortDesc(sp.description);
      local.cat = typeToCat(sp.productType);
    } else {
      products.push({
        id: sku,
        handle: sp.handle,
        name: sp.title,
        cat: typeToCat(sp.productType),
        desc: shortDesc(sp.description),
        price: price,
        tag: '',
        art: typeToCat(sp.productType) === 'grills' ? 'portable' : 'fuel',
        stock: stock,
        rating: 0,
        reviewCount: 0
      });
    }
  });

  renderProducts();
  renderAccessories();
  renderPackages();
  const btn = document.querySelector('button.place-order');
  if (btn && Object.keys(shopifyVariantIds).length) {
    btn.innerHTML = 'Checkout with Shopify <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }
  console.info('[Shopify] Products synced:', Object.keys(shopifyVariantIds));
}

async function createShopifyCart() {
  const lines = Object.values(cart)
    .filter(item => shopifyVariantIds[item.id])
    .map(item => ({ merchandiseId: shopifyVariantIds[item.id], quantity: item.qty }));

  if (!lines.length) return null;

  const data = await shopifyFetch(
    `mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }`,
    { lines }
  );

  if (data?.cartCreate?.userErrors?.length) {
    console.warn('[Shopify] Cart errors:', data.cartCreate.userErrors);
  }
  return data?.cartCreate?.cart?.checkoutUrl || null;
}

// ===== Media helper: real image if uploaded, else line-art SVG =====
function mediaFor(item, opts) {
  opts = opts || {};
  const cls = opts.className || 'product-art';
  const id = item && item.id;
  const altRaw = item ? `${item.name} — ${item.cat === 'grills' ? 'charcoal BBQ grill' : 'BBQ grilling accessory'} | Ember & Iron Pakistan` : '';
  const altText = altRaw.replace(/"/g, '&quot;');
  if (id && window.PRODUCT_IMAGES && window.PRODUCT_IMAGES[id]) {
    return `<img src="${window.PRODUCT_IMAGES[id]}" alt="${altText}" class="${cls} real-photo" width="600" height="600" loading="lazy" decoding="async">`;
  }
  // Give the line-art an accessible, keyword-relevant label
  return artSvg(item && item.art).replace('<svg ', `<svg role="img" aria-label="${altText}" `);
}

// ===== Product art SVGs =====
function artSvg(type) {
  const stroke = '#1C1916';
  switch(type) {
    case 'kamado':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <ellipse cx="100" cy="92" rx="62" ry="72"/>
        <path d="M38 92 Q100 76 162 92"/>
        <path d="M46 60 Q100 44 154 60"/>
        <path d="M38 92 L38 120 Q100 138 162 120 L162 92"/>
        <rect x="90" y="14" width="20" height="12" rx="1"/>
        <line x1="95" y1="18" x2="105" y2="18"/>
        <path d="M55 76 Q100 64 145 76" stroke-width="2"/>
        <line x1="58" y1="162" x2="48" y2="186"/>
        <line x1="142" y1="162" x2="152" y2="186"/>
        <line x1="44" y1="186" x2="156" y2="186" stroke-width="2"/>
      </svg>`;
    case 'gas':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="32" y="58" width="136" height="58" rx="3"/>
        <line x1="32" y1="80" x2="168" y2="80"/>
        <line x1="32" y1="100" x2="168" y2="100"/>
        <circle cx="50" cy="68" r="2.5"/>
        <circle cx="74" cy="68" r="2.5"/>
        <circle cx="100" cy="68" r="2.5"/>
        <circle cx="126" cy="68" r="2.5"/>
        <rect x="40" y="30" width="120" height="32" rx="3" stroke-width="2"/>
        <circle cx="100" cy="46" r="6"/>
        <line x1="32" y1="116" x2="32" y2="170"/>
        <line x1="168" y1="116" x2="168" y2="170"/>
        <line x1="32" y1="135" x2="168" y2="135"/>
        <circle cx="48" cy="170" r="8"/>
        <circle cx="152" cy="170" r="8"/>
        <rect x="170" y="80" width="22" height="3"/>
      </svg>`;
    case 'kettle':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <path d="M40 100 Q40 50 100 50 Q160 50 160 100" stroke-width="1.6"/>
        <path d="M40 100 L40 110 Q100 130 160 110 L160 100"/>
        <line x1="40" y1="105" x2="160" y2="105" stroke-dasharray="2 3"/>
        <path d="M55 60 Q100 46 145 60" stroke-width="2"/>
        <ellipse cx="100" cy="36" rx="12" ry="3"/>
        <line x1="100" y1="36" x2="100" y2="28"/>
        <line x1="55" y1="120" x2="40" y2="180"/>
        <line x1="145" y1="120" x2="160" y2="180"/>
        <line x1="100" y1="125" x2="100" y2="180"/>
        <line x1="36" y1="182" x2="164" y2="182" stroke-width="1.8"/>
      </svg>`;
    case 'offset':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <ellipse cx="110" cy="100" rx="60" ry="32"/>
        <path d="M50 100 L50 116 Q110 144 170 116 L170 100"/>
        <line x1="50" y1="108" x2="170" y2="108" stroke-dasharray="2 3"/>
        <rect x="20" y="92" width="32" height="34" rx="2"/>
        <line x1="28" y1="100" x2="44" y2="100"/>
        <line x1="28" y1="108" x2="44" y2="108"/>
        <line x1="28" y1="116" x2="44" y2="116"/>
        <rect x="156" y="44" width="14" height="36"/>
        <line x1="156" y1="50" x2="170" y2="50"/>
        <path d="M168 44 L172 36 L176 44"/>
        <line x1="40" y1="130" x2="32" y2="174"/>
        <line x1="180" y1="130" x2="188" y2="174"/>
        <line x1="28" y1="178" x2="192" y2="178" stroke-width="1.8"/>
        <circle cx="56" cy="180" r="6"/>
        <circle cx="164" cy="180" r="6"/>
      </svg>`;
    case 'tabletop':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="36" y="78" width="128" height="54" rx="3"/>
        <line x1="36" y1="96" x2="164" y2="96"/>
        <rect x="46" y="48" width="108" height="32" rx="3" stroke-width="2"/>
        <path d="M58 64 L70 64 M82 64 L94 64 M106 64 L118 64 M130 64 L142 64"/>
        <line x1="36" y1="132" x2="42" y2="148"/>
        <line x1="164" y1="132" x2="158" y2="148"/>
        <line x1="42" y1="148" x2="158" y2="148" stroke-width="1.8"/>
        <path d="M62 38 L62 30 L138 30 L138 38" stroke-width="1.8"/>
      </svg>`;
    case 'portable':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="42" y="86" width="116" height="60" rx="6"/>
        <line x1="42" y1="106" x2="158" y2="106"/>
        <line x1="42" y1="124" x2="158" y2="124"/>
        <rect x="54" y="60" width="92" height="28" rx="4" stroke-width="2"/>
        <path d="M68 75 L80 75 M92 75 L104 75 M116 75 L128 75"/>
        <path d="M72 54 Q100 38 128 54" stroke-width="2"/>
        <line x1="72" y1="54" x2="72" y2="48"/>
        <line x1="128" y1="54" x2="128" y2="48"/>
        <rect x="58" y="146" width="84" height="6"/>
      </svg>`;
    case 'tool':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <path d="M70 30 L130 30 L138 130 L62 130 Z"/>
        <line x1="70" y1="50" x2="130" y2="50"/>
        <line x1="68" y1="70" x2="132" y2="70"/>
        <line x1="66" y1="90" x2="134" y2="90"/>
        <line x1="64" y1="110" x2="136" y2="110"/>
        <rect x="86" y="130" width="28" height="10"/>
        <rect x="78" y="140" width="44" height="50" rx="6"/>
        <line x1="86" y1="152" x2="114" y2="152"/>
        <line x1="86" y1="164" x2="114" y2="164"/>
        <line x1="86" y1="176" x2="114" y2="176"/>
      </svg>`;
    case 'fuel':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="56" y="46" width="88" height="120" rx="2"/>
        <rect x="56" y="46" width="88" height="22"/>
        <text x="100" y="100" font-family="Figtree" font-size="22" font-weight="300" fill="${stroke}" text-anchor="middle">10kg</text>
        <text x="100" y="124" font-family="Figtree" font-size="9" letter-spacing="0.15em" fill="${stroke}" text-anchor="middle">CHARCOAL</text>
        <line x1="68" y1="142" x2="132" y2="142"/>
        <line x1="68" y1="150" x2="132" y2="150"/>
        <line x1="68" y1="158" x2="132" y2="158"/>
      </svg>`;
    case 'thermometer':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="68" y="30" width="64" height="50" rx="4"/>
        <rect x="76" y="40" width="48" height="26" fill="${stroke}" fill-opacity="0.04"/>
        <text x="100" y="58" font-family="Figtree" font-size="13" font-weight="500" text-anchor="middle" fill="${stroke}" stroke="none">72°C</text>
        <circle cx="84" cy="73" r="2.2" fill="${stroke}"/>
        <circle cx="100" cy="73" r="2.2" fill="${stroke}"/>
        <circle cx="116" cy="73" r="2.2" fill="${stroke}"/>
        <line x1="100" y1="80" x2="100" y2="178" stroke-width="2.4"/>
        <circle cx="100" cy="180" r="3"/>
      </svg>`;
    case 'gloves':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <path d="M58 168 L58 102 Q58 84 72 84 L84 84 L84 52 Q84 42 92 42 Q100 42 100 52 L100 84 L112 84 L112 56 Q112 48 120 48 Q128 48 128 56 L128 84 L138 84 Q146 84 146 92 L146 136 Q146 156 134 168 Z"/>
        <line x1="58" y1="156" x2="138" y2="156"/>
        <rect x="58" y="168" width="80" height="10"/>
        <line x1="70" y1="173" x2="78" y2="173"/>
        <line x1="86" y1="173" x2="94" y2="173"/>
        <line x1="102" y1="173" x2="110" y2="173"/>
        <line x1="118" y1="173" x2="126" y2="173"/>
        <path d="M84 96 L84 108 M100 96 L100 108 M112 96 L112 108 M128 96 L128 106" stroke-dasharray="1.5 2"/>
      </svg>`;
    case 'firestarter':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="44" y="128" width="46" height="46"/>
        <rect x="110" y="128" width="46" height="46"/>
        <rect x="77" y="82" width="46" height="46"/>
        <line x1="44" y1="142" x2="90" y2="142"/>
        <line x1="44" y1="156" x2="90" y2="156"/>
        <line x1="110" y1="142" x2="156" y2="142"/>
        <line x1="110" y1="156" x2="156" y2="156"/>
        <line x1="77" y1="96" x2="123" y2="96"/>
        <line x1="77" y1="110" x2="123" y2="110"/>
        <path d="M100 78 Q88 62 96 44 Q102 56 100 38 Q116 50 110 70 Q104 78 100 78 Z"/>
      </svg>`;
    case 'meatclaws':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="74" y="118" width="52" height="56" rx="6"/>
        <line x1="80" y1="138" x2="120" y2="138"/>
        <line x1="80" y1="150" x2="120" y2="150"/>
        <line x1="80" y1="162" x2="120" y2="162"/>
        <path d="M78 118 L66 60 Q68 50 76 56 L84 110" stroke-width="1.6"/>
        <path d="M92 118 L86 50 Q90 40 96 48 L96 110" stroke-width="1.6"/>
        <path d="M108 118 L114 50 Q110 40 104 48 L104 110" stroke-width="1.6"/>
        <path d="M122 118 L134 60 Q132 50 124 56 L116 110" stroke-width="1.6"/>
      </svg>`;
    case 'bastingmop':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="20" y="98" width="110" height="10" rx="3"/>
        <line x1="34" y1="103" x2="124" y2="103" stroke-dasharray="1.5 3"/>
        <circle cx="28" cy="103" r="2.5"/>
        <rect x="130" y="92" width="14" height="22" stroke-width="1.6"/>
        <ellipse cx="166" cy="103" rx="20" ry="22"/>
        <path d="M178 80 L192 70" stroke-width="1.1"/>
        <path d="M182 88 L196 82" stroke-width="1.1"/>
        <path d="M184 95 L198 92" stroke-width="1.1"/>
        <path d="M186 103 L200 103" stroke-width="1.1"/>
        <path d="M184 111 L198 114" stroke-width="1.1"/>
        <path d="M182 118 L196 124" stroke-width="1.1"/>
        <path d="M178 126 L192 136" stroke-width="1.1"/>
        <path d="M170 130 L180 144" stroke-width="1.1"/>
      </svg>`;
    case 'longclaws':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.6">
        <line x1="30" y1="70" x2="158" y2="100"/>
        <line x1="30" y1="130" x2="158" y2="100"/>
        <circle cx="158" cy="100" r="5" fill="${stroke}"/>
        <path d="M156 96 L172 84"/>
        <path d="M156 104 L172 116"/>
        <path d="M168 80 L178 84 L172 90"/>
        <path d="M168 120 L178 116 L172 110"/>
        <rect x="22" y="62" width="22" height="14" rx="3" fill="${stroke}" fill-opacity="0.06"/>
        <rect x="22" y="124" width="22" height="14" rx="3" fill="${stroke}" fill-opacity="0.06"/>
        <line x1="28" y1="69" x2="40" y2="69"/>
        <line x1="28" y1="131" x2="40" y2="131"/>
      </svg>`;
    case 'brassbrush':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <path d="M60 58 Q100 42 140 58" stroke-width="2"/>
        <rect x="56" y="56" width="88" height="24" rx="12"/>
        <line x1="74" y1="68" x2="126" y2="68" stroke-dasharray="1.5 3"/>
        <rect x="62" y="84" width="76" height="16" rx="2"/>
        <line x1="70" y1="100" x2="70" y2="132"/>
        <line x1="80" y1="100" x2="79" y2="137"/>
        <line x1="90" y1="100" x2="90" y2="134"/>
        <line x1="100" y1="100" x2="100" y2="139"/>
        <line x1="110" y1="100" x2="110" y2="134"/>
        <line x1="120" y1="100" x2="121" y2="137"/>
        <line x1="130" y1="100" x2="130" y2="132"/>
      </svg>`;
    case 'grillbrush':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="30" y="92" width="110" height="18" rx="3"/>
        <line x1="48" y1="101" x2="128" y2="101" stroke-dasharray="1.5 3"/>
        <circle cx="42" cy="101" r="3"/>
        <rect x="140" y="78" width="32" height="46" rx="2"/>
        <line x1="146" y1="90" x2="166" y2="90"/>
        <line x1="146" y1="101" x2="166" y2="101"/>
        <line x1="146" y1="112" x2="166" y2="112"/>
        <path d="M172 80 L186 74"/>
        <path d="M172 90 L188 88"/>
        <path d="M172 101 L188 101"/>
        <path d="M172 112 L188 114"/>
        <path d="M172 122 L186 128"/>
      </svg>`;
    case 'bastingbrush':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="46" y="94" width="84" height="14" rx="3"/>
        <line x1="56" y1="101" x2="120" y2="101" stroke-dasharray="1.5 3"/>
        <circle cx="56" cy="101" r="2.5"/>
        <rect x="130" y="88" width="16" height="26"/>
        <line x1="134" y1="94" x2="142" y2="94"/>
        <line x1="134" y1="100" x2="142" y2="100"/>
        <line x1="134" y1="108" x2="142" y2="108"/>
        <path d="M146 80 L164 72"/>
        <path d="M146 88 L166 86"/>
        <path d="M146 95 L168 94"/>
        <path d="M146 102 L168 104"/>
        <path d="M146 110 L166 116"/>
        <path d="M146 118 L164 124"/>
        <path d="M146 124 L160 130"/>
      </svg>`;
    case 'blower':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <rect x="32" y="74" width="80" height="56" rx="6"/>
        <line x1="42" y1="84" x2="42" y2="120"/>
        <line x1="50" y1="84" x2="50" y2="120"/>
        <line x1="58" y1="84" x2="58" y2="120"/>
        <line x1="66" y1="84" x2="66" y2="120"/>
        <path d="M112 88 L156 76 L156 128 L112 116 Z"/>
        <rect x="54" y="130" width="34" height="44" rx="4"/>
        <circle cx="71" cy="148" r="4"/>
        <line x1="60" y1="164" x2="82" y2="164"/>
        <path d="M162 84 L178 80" stroke-dasharray="2 2"/>
        <path d="M162 102 L182 102" stroke-dasharray="2 2"/>
        <path d="M162 120 L178 124" stroke-dasharray="2 2"/>
      </svg>`;
    case 'charcoalbag':
      return `<svg class="product-art" viewBox="0 0 200 200" fill="none" stroke="${stroke}" stroke-width="1.4">
        <path d="M58 60 L58 174 L142 174 L142 60"/>
        <path d="M58 60 L70 46 L130 46 L142 60"/>
        <line x1="70" y1="46" x2="70" y2="60"/>
        <line x1="130" y1="46" x2="130" y2="60"/>
        <rect x="74" y="78" width="52" height="50"/>
        <text x="100" y="100" font-family="Figtree" font-size="18" font-weight="300" fill="${stroke}" text-anchor="middle" stroke="none">5kg</text>
        <text x="100" y="118" font-family="Figtree" font-size="7" letter-spacing="0.18em" fill="${stroke}" text-anchor="middle" stroke="none">CHARCOAL</text>
        <line x1="68" y1="148" x2="132" y2="148"/>
        <line x1="68" y1="158" x2="132" y2="158"/>
      </svg>`;
    default:
      return '';
  }
}

// ===== Cart state =====
let cart = {};

const CART_STORAGE_KEY = 'ember-cart-v1';
function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
}
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // Drop entries for products that no longer exist (e.g. removed SKUs)
      Object.keys(parsed).forEach(id => {
        const item = parsed[id];
        if (!item || !item.qty || item.qty <= 0) return;
        const stillExists = item.isPackage
          ? (typeof packages !== 'undefined' && packages.some(p => p.id === id))
          : products.some(p => p.id === id);
        if (stillExists) cart[id] = item;
      });
    }
  } catch (e) {}
}

function fmt(n) {
  return n.toLocaleString('en-PK');
}

function updateCartUI() {
  saveCart();
  const items = Object.values(cart);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  document.querySelectorAll('.cart-count-el').forEach(el => {
    el.textContent = count;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  });

  document.getElementById('cart-total').textContent = `PKR ${fmt(total)}`;
  document.getElementById('checkout-btn').disabled = items.length === 0;

  renderSuggestions();
  const itemsEl = document.getElementById('cart-items');
  if (items.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Nothing in the fire yet.</div>';
    return;
  }
  itemsEl.innerHTML = items.map(i => `
    <div class="cart-item">
      <div class="cart-item-art">${mediaFor(i)}</div>
      <div class="cart-item-info">
        <div class="name">${i.name}</div>
        <div class="qty-row">
          <div class="qty-control">
            <button onclick="changeQty('${i.id}', -1)" aria-label="Decrease">−</button>
            <span class="q">${i.qty}</span>
            <button onclick="changeQty('${i.id}', 1)" aria-label="Increase">+</button>
          </div>
          <span>${i.id}</span>
        </div>
      </div>
      <div>
        <div class="cart-item-price">PKR ${fmt(i.qty * i.price)}</div>
        <button class="cart-item-remove" onclick="removeItem('${i.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

// Per-card quantity selection state (resets to 1 on reload)
const cardQty = {};
function getCardQty(id) { return cardQty[id] || 1; }
function changeCardQty(id, delta) {
  const next = Math.max(1, getCardQty(id) + delta);
  cardQty[id] = next;
  document.querySelectorAll('[data-qty-display="' + id + '"]').forEach(el => el.textContent = next);
}

// ===== Wishlist =====
const WISHLIST_STORAGE_KEY = 'ember-wishlist-v1';
let wishlist = new Set();

function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      wishlist = new Set(ids.filter(id => products.some(p => p.id === id)));
    }
  } catch (e) {}
}
function saveWishlist() {
  try { localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([...wishlist])); } catch (e) {}
}
function isInWishlist(id) { return wishlist.has(id); }
function toggleWishlist(id, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (wishlist.has(id)) {
    wishlist.delete(id);
    showToast('Removed from wishlist');
  } else {
    wishlist.add(id);
    showToast(`${p.name} saved to wishlist`);
  }
  saveWishlist();
  updateWishlistUI();
}
function updateWishlistUI() {
  document.querySelectorAll('.wishlist-count-el').forEach(el => {
    el.textContent = wishlist.size;
    el.classList.toggle('hidden', wishlist.size === 0);
  });
  document.querySelectorAll('.wishlist-btn[data-wid]').forEach(btn => {
    const on = wishlist.has(btn.dataset.wid);
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Save to wishlist');
  });
  if (document.getElementById('view-wishlist') && document.getElementById('view-wishlist').classList.contains('active')) {
    renderWishlist();
  }
}
function showWishlist(e) {
  if (e) e.preventDefault();
  renderWishlist();
  switchView('view-wishlist');
}
function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  if (!grid) return;
  const items = [...wishlist].map(id => products.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="wishlist-empty">
        <div class="big">Your wishlist is empty.</div>
        <div class="small">Tap the heart on any product to save it for later</div>
        <button type="button" class="btn-shop" onclick="showAccessories(event)">Browse accessories</button>
      </div>`;
    return;
  }
  grid.innerHTML = items.map(p => productCardHtml(p, 'prod-wl')).join('');
}

// ===== Recently viewed =====
const RECENT_STORAGE_KEY = 'ember-recent-v1';
let recentlyViewed = [];
function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      recentlyViewed = ids.filter(id => products.some(p => p.id === id));
    }
  } catch (e) {}
}
function trackRecent(id) {
  if (!products.some(p => p.id === id)) return;
  recentlyViewed = recentlyViewed.filter(x => x !== id);
  recentlyViewed.unshift(id);
  recentlyViewed = recentlyViewed.slice(0, 8);
  try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentlyViewed)); } catch (e) {}
  renderRecentlyViewed();
}
function renderRecentlyViewed() {
  const section = document.getElementById('recently-viewed-section');
  const rail = document.getElementById('recently-viewed-rail');
  if (!section || !rail) return;
  const items = recentlyViewed.map(id => products.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  rail.innerHTML = items.map(p => `
    <article class="rv-card" onclick="showProduct(event, '${p.id}')">
      <div class="rv-art">${mediaFor(p)}</div>
      <div class="rv-meta">${p.id} · ${p.cat}</div>
      <div class="name">${p.name}</div>
      <div class="price"><span class="ccy">PKR</span>${fmt(p.price)}</div>
    </article>
  `).join('');
}

function stockState(p) {
  if (p == null || p.stock === undefined || p.stock === null) {
    return { label: 'In stock', cls: 'in', soldOut: false, remaining: Infinity };
  }
  if (p.stock <= 0) return { label: 'Sold out', cls: 'out', soldOut: true, remaining: 0 };
  if (p.stock <= 5) return { label: `Only ${p.stock} left`, cls: 'low', soldOut: false, remaining: p.stock };
  return { label: 'In stock', cls: 'in', soldOut: false, remaining: p.stock };
}

function renderSuggestions() {
  const section = document.getElementById('cart-suggest');
  const list = document.getElementById('cart-suggest-list');
  if (!section || !list) return;
  if (Object.keys(cart).length === 0) { section.style.display = 'none'; return; }
  // Suggest accessories not yet in cart, in-stock, cheapest first; max 3.
  const items = products
    .filter(p => p.cat === 'accessories'
              && !cart[p.id]
              && (p.stock === undefined || p.stock > 0))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = items.map(p => `
    <div class="cart-suggest-item">
      <div class="cart-suggest-art">${mediaFor(p)}</div>
      <div class="cart-suggest-info">
        <div class="name">${p.name}</div>
        <div class="price">PKR ${fmt(p.price)}</div>
      </div>
      <button type="button" class="cart-suggest-add" onclick="addToCart('${p.id}', 1)" aria-label="Add ${p.name}">+</button>
    </div>
  `).join('');
}

function addToCart(id, qty) {
  qty = Math.max(1, parseInt(qty, 10) || 1);
  const p = products.find(x => x.id === id);
  if (!p) return;
  const s = stockState(p);
  if (s.soldOut) { showToast('Sorry, that item is sold out'); return; }
  const inCartQty = (cart[id] && cart[id].qty) || 0;
  const remaining = s.remaining - inCartQty;
  if (remaining <= 0) { showToast(`No more ${p.name} available`); return; }
  if (qty > remaining) qty = remaining;
  if (cart[id]) cart[id].qty += qty;
  else cart[id] = { ...p, qty: qty };
  // Reset card stepper after add
  cardQty[id] = 1;
  document.querySelectorAll('[data-qty-display="' + id + '"]').forEach(el => el.textContent = 1);
  trackRecent(id);
  updateCartUI();
  const suffix = qty > 1 ? ` (×${qty})` : '';
  showToast(`${p.name}${suffix} added to your order`);
}

function renderStars(rating) {
  if (!rating) return '';
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled));
}

// ===== Product Detail Page (PDP) =====
function productSpecsHtml(p) {
  const grillsSpecs = [
    'Hand-welded 4mm steel cookbox',
    'Folds flat for easy storage and transport',
    'Includes cast-iron grate',
    'Hand-built in Lahore, lifetime warranty on cookbox'
  ];
  const accSpecs = {
    fuel: ['Single-origin acacia lump charcoal', '10kg resealable kraft bag', 'Low ash, clean smoke'],
    thermometer: ['2-second instant-read probe', 'Backlit display, IP65 water-resistant', 'CR2032 battery — ~1,500 hours'],
    firestarter: ['Natural wood-wool and wax cubes', '30+ fires per box', 'No fumes or taste transfer'],
    bastingmop: ['40cm walnut handle', 'Cotton mop head, replaceable', 'Heat-safe to 260°C, hand-wash only'],
    grillbrush: ['Brass bristles, food-safe', 'Replaceable head', 'Walnut handle with leather loop'],
    blower: ['USB-C rechargeable lithium cell', '3 speeds, 2-hour runtime', 'Lights coals in under 90 seconds'],
    charcoalbag: ['Pakistan-sourced hardwood charcoal', '5kg resealable kraft bag', 'Even, long burn'],
    longclaws: ['40cm stainless steel arms', 'Food-grade resin grips', 'Dishwasher safe']
  };
  const specs = p.cat === 'grills' ? grillsSpecs : (accSpecs[p.art] || []);
  if (!specs.length) return '';
  return `<div class="pdp-specs"><h3>What's included</h3><ul>${specs.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
}

function showProduct(e, id) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const p = products.find(x => x.id === id);
  if (!p) return;
  trackRecent(id);
  const isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (p.handle && !isLocal) { window.location.assign('/products/' + p.handle); return; }
  renderProduct(p);
  switchView('view-product', { slug: id });
}

function renderProduct(p) {
  const s = stockState(p);
  const wished = isInWishlist(p.id);
  const related = products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const ratingHtml = '';
  document.getElementById('pdp-content').innerHTML = `
    <button class="pdp-back" type="button" onclick="history.back()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
      Back
    </button>
    <div class="pdp-grid">
      <div class="pdp-art">
        ${p.tag ? `<span class="tag ${p.tag === 'new' ? 'new' : ''}">${p.tag === 'new' ? '· New' : '· ' + p.tag}</span>` : ''}
        <button class="wishlist-btn ${wished ? 'active' : ''}" data-wid="${p.id}" type="button" onclick="toggleWishlist('${p.id}', event)" aria-label="${wished ? 'Remove from wishlist' : 'Save to wishlist'}" aria-pressed="${wished}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${mediaFor(p)}
      </div>
      <div class="pdp-info">
        <div class="pdp-meta">${p.id} · ${p.cat}</div>
        <h1>${p.name}</h1>
        ${ratingHtml}
        <div class="pdp-price"><span class="ccy">PKR</span>${fmt(p.price)}</div>
        <div class="stock-indicator ${s.cls}" style="margin-bottom:24px;"><span class="dot" aria-hidden="true"></span>${s.label}</div>
        <p class="pdp-desc">${p.desc}</p>
        <div class="pdp-actions">
          <div class="qty-stepper-mini" role="group" aria-label="Quantity">
            <button type="button" onclick="changeCardQty('${p.id}', -1)" aria-label="Decrease"${s.soldOut ? ' disabled' : ''}>−</button>
            <span class="q" data-qty-display="${p.id}">${getCardQty(p.id)}</span>
            <button type="button" onclick="changeCardQty('${p.id}', 1)" aria-label="Increase"${s.soldOut ? ' disabled' : ''}>+</button>
          </div>
          ${s.soldOut
            ? '<button class="pdp-add" type="button" disabled>Sold out</button>'
            : `<button class="pdp-add" type="button" onclick="addToCart('${p.id}', getCardQty('${p.id}'))">Add to cart <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`}
        </div>
        ${productSpecsHtml(p)}
      </div>
    </div>
    ${related.length ? `
      <section class="pdp-related">
        <h3>You might also <em>like</em></h3>
        <div class="pdp-related-grid">
          ${related.map(r => productCardHtml(r, 'pdp-rel')).join('')}
        </div>
      </section>` : ''}
  `;
}

// Shared product card markup
function productCardHtml(p, idPrefix) {
  idPrefix = idPrefix || 'prod';
  const s = stockState(p);
  const articleClass = 'product' + (s.soldOut ? ' sold-out' : '');
  const addBtn = s.soldOut
    ? `<button class="add-btn" disabled aria-disabled="true">Sold out</button>`
    : `<button class="add-btn" onclick="addToCart('${p.id}', getCardQty('${p.id}'))">
        Add
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      </button>`;
  const wished = isInWishlist(p.id);
  return `
    <article class="${articleClass}" id="${idPrefix}-${p.id}" data-cat="${p.cat}">
      <div class="product-art-frame">
        ${p.tag ? `<span class="tag ${p.tag === 'new' ? 'new' : ''}">${p.tag === 'new' ? '· New' : '· ' + p.tag}</span>` : ''}
        <button class="wishlist-btn ${wished ? 'active' : ''}" data-wid="${p.id}" onclick="toggleWishlist('${p.id}', event)" aria-label="${wished ? 'Remove from wishlist' : 'Save to wishlist'}" aria-pressed="${wished}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <a class="art-clickable" href="${productUrl(p)}" onclick="showProduct(event, '${p.id}')" aria-label="View ${p.name}">${mediaFor(p)}</a>
      </div>
      <div class="product-meta">
        <span>${p.id}</span>
        <span>${p.cat}</span>
      </div>
      <h3><a href="${productUrl(p)}" class="product-name-link" onclick="showProduct(event, '${p.id}')">${p.name}</a></h3>
      <p class="desc">${p.desc}</p>
      <div class="stock-indicator ${s.cls}" aria-label="${s.label}">
        <span class="dot" aria-hidden="true"></span>${s.label}
      </div>
      <div class="product-foot">
        <div class="price"><span class="ccy">PKR</span>${fmt(p.price)}</div>
        <div class="qty-add">
          <div class="qty-stepper-mini" role="group" aria-label="Quantity for ${p.name}">
            <button type="button" onclick="changeCardQty('${p.id}', -1)" aria-label="Decrease quantity"${s.soldOut ? ' disabled' : ''}>−</button>
            <span class="q" data-qty-display="${p.id}">${getCardQty(p.id)}</span>
            <button type="button" onclick="changeCardQty('${p.id}', 1)" aria-label="Increase quantity"${s.soldOut ? ' disabled' : ''}>+</button>
          </div>
          ${addBtn}
        </div>
      </div>
    </article>
  `;
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateCartUI();
}

function removeItem(id) {
  delete cart[id];
  updateCartUI();
}

function openCart() {
  document.getElementById('cart-backdrop').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
}
function closeCart() {
  document.getElementById('cart-backdrop').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}

// ===== Toast =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ===== Featured selections =====
const featuredGrillIds = ['EMB-001', 'EMB-002', 'EMB-003', 'EMB-004'];

// ===== Bundle packages =====
const packages = [
  {
    id: 'PKG-001',
    name: 'The Starter',
    tier: 'Starter',
    desc: 'A collapsible grill with the essentials. For first cookouts and small balconies.',
    grillId: 'EMB-001',
    accessoryIds: ['EMB-019', 'EMB-013', 'EMB-016'],
    originalPrice: 11648,
    price: 10480,
    art: 'portable'
  },
  {
    id: 'PKG-002',
    name: 'The Weekend',
    tier: 'Everyday',
    desc: 'A collapsible grill with a grilling top plus everything for unhurried Sunday cookouts.',
    grillId: 'EMB-003',
    accessoryIds: ['EMB-010', 'EMB-011'],
    originalPrice: 12197,
    price: 10980,
    art: 'tabletop'
  },
  {
    id: 'PKG-003',
    name: 'The Pitmaster',
    tier: 'Serious',
    desc: 'Our largest collapsible grill with the precision tools serious cookouts demand.',
    grillId: 'EMB-004',
    accessoryIds: ['EMB-011', 'EMB-018', 'EMB-010', 'EMB-013', 'EMB-016'],
    originalPrice: 16745,
    price: 15070,
    art: 'tabletop'
  },
  {
    id: 'PKG-004',
    name: 'The Flagship',
    tier: 'Complete',
    desc: 'A collapsible grill with every accessory in the workshop. The set built once, kept forever.',
    grillId: 'EMB-001',
    accessoryIds: ['EMB-010', 'EMB-011', 'EMB-013', 'EMB-016', 'EMB-018', 'EMB-019'],
    originalPrice: 14045,
    price: 12640,
    art: 'portable'
  }
];

// ===== Render accessories page =====
let accessoryFilter = 'all';
let accessorySort = 'default';

function setAccessoryFilter(f) {
  accessoryFilter = f;
  document.querySelectorAll('.acc-filter button').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  renderAccessories();
}
function setAccessorySort(s) {
  accessorySort = s;
  renderAccessories();
}

function renderAccessories() {
  const grid = document.getElementById('accessories-grid');
  if (!grid) return;
  const total = products.filter(p => p.cat === 'accessories').length;
  let items = products.filter(p => p.cat === 'accessories');
  if (accessoryFilter === 'new') items = items.filter(p => p.tag === 'new');
  switch (accessorySort) {
    case 'name-asc':  items.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'name-desc': items.sort((a, b) => b.name.localeCompare(a.name)); break;
    case 'price-asc': items.sort((a, b) => a.price - b.price); break;
    case 'price-desc':items.sort((a, b) => b.price - a.price); break;
  }
  const countEl = document.getElementById('acc-result-count');
  if (countEl) {
    countEl.innerHTML = (accessoryFilter === 'all' && accessorySort === 'default')
      ? `Every tool <span class="count">· ${total}</span>`
      : `Showing <span class="count">${items.length}</span> of ${total}`;
  }
  if (items.length === 0) {
    grid.innerHTML = '<div class="acc-empty">No accessories match this filter.</div>';
    return;
  }
  grid.innerHTML = items.map(p => productCardHtml(p, 'prod-acc')).join('');
}

function showAccessories(e) {
  if (e) e.preventDefault();
  renderAccessories();
  switchView('view-accessories');
}

// ===== Policy / info pages =====
const POLICY_PAGES = {
  shipping: {
    eyebrow: 'Logistics',
    title: 'Shipping &amp; <em>delivery</em>',
    body: `
      <p class="lead">Most orders leave the workshop within 48 hours. Delivery is handled by our own riders inside Lahore and by major couriers across Pakistan.</p>
      <h2>Coverage</h2>
      <ul>
        <li>Lahore, Karachi, Islamabad: 2–3 business days</li>
        <li>Other major cities: 3–5 business days</li>
        <li>Remote areas: 5–7 business days</li>
      </ul>
      <h2>Fees</h2>
      <p>Free delivery on orders over PKR 12,000. Standard delivery is PKR 1,500 anywhere in Pakistan.</p>
      <h2>Installation</h2>
      <p>Free workshop installation in Lahore for grills over PKR 100,000. We unbox, assemble, and brief you on care.</p>
    `
  },
  returns: {
    eyebrow: 'Policy',
    title: 'Returns &amp; <em>refunds</em>',
    body: `
      <p class="lead">If something isn't right, return it within 30 days for a full refund or exchange.</p>
      <h2>Eligibility</h2>
      <ul>
        <li>Item must be unused and in original packaging</li>
        <li>Within 30 days of delivery</li>
        <li>Consumables (charcoal, fire starters) are non-returnable once opened</li>
      </ul>
      <h2>Process</h2>
      <p>Email <strong>returns@emberandiron.pk</strong> with your order number. We'll arrange pickup and process the refund within 7 business days of receipt.</p>
      <h2>Damage in transit</h2>
      <p>Photograph the package on receipt before opening if it looks damaged. We replace any transit-damaged item at no cost.</p>
    `
  },
  warranty: {
    eyebrow: 'Promise',
    title: 'Lifetime <em>warranty</em>',
    body: `
      <p class="lead">Every cookbox we build carries a lifetime warranty against structural failure and burn-through, to the original owner.</p>
      <h2>What's covered</h2>
      <ul>
        <li>Cookbox structural welds</li>
        <li>Cookbox burn-through</li>
        <li>Manufacturing defects in tools and accessories (1 year)</li>
      </ul>
      <h2>What's not covered</h2>
      <ul>
        <li>Cosmetic wear, patina, surface rust from normal use</li>
        <li>Damage from neglect, modification, or commercial use</li>
        <li>Consumables and replaceable parts (grates, brush heads)</li>
      </ul>
      <h2>How to claim</h2>
      <p>Email <strong>warranty@emberandiron.pk</strong> with photos and your purchase reference. We respond within 48 hours.</p>
    `
  },
  care: {
    eyebrow: 'Maintenance',
    title: 'Care &amp; <em>service</em>',
    body: `
      <p class="lead">A well-cared-for grill outlasts its owner. Our cookboxes are designed for daily use and decades of fire.</p>
      <h2>After every cook</h2>
      <ul>
        <li>Brush the grate while still warm</li>
        <li>Empty ash once cool</li>
        <li>Leave the lid open until fully cool</li>
      </ul>
      <h2>Monthly</h2>
      <p>Wipe down with a dry cloth. Inspect grates for cracks. Re-season cast-iron grates with food-grade oil.</p>
      <h2>Seasonal service</h2>
      <p>We offer free annual servicing for all Ember grills in Lahore. Book a slot at <strong>service@emberandiron.pk</strong>.</p>
    `
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy <em>policy</em>',
    body: `
      <p class="lead">We collect the minimum data needed to deliver your order and protect your account. We never sell your information.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Order details: name, address, phone, email</li>
        <li>Payment information (processed by our payment provider; we don't store cards)</li>
        <li>Site analytics (anonymised, used only to improve the store)</li>
      </ul>
      <h2>How we use it</h2>
      <p>To process your order, deliver products, send shipping updates, and respond to your queries. Marketing emails only with your explicit consent.</p>
      <h2>Your rights</h2>
      <p>Request a copy of your data, deletion of your account, or unsubscribe from marketing at any time: <strong>privacy@emberandiron.pk</strong>.</p>
    `
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms &amp; <em>conditions</em>',
    body: `
      <p class="lead">By placing an order on emberandiron.pk you agree to the following terms. These exist to make expectations clear, not to trap anyone.</p>
      <h2>Orders</h2>
      <p>Orders are confirmed when payment is received. We reserve the right to cancel orders for products that are out of stock or mispriced; full refunds are issued promptly.</p>
      <h2>Pricing</h2>
      <p>Prices are in PKR, inclusive of GST. Shipping is calculated at checkout.</p>
      <h2>Liability</h2>
      <p>Our grills cook with live fire. Use with reasonable care, away from flammable structures, and never leave a lit grill unattended. We are not liable for misuse-related damage.</p>
      <h2>Disputes</h2>
      <p>Any disputes are governed by the laws of Pakistan and resolved in Lahore courts.</p>
    `
  },
  about: {
    eyebrow: 'The workshop',
    title: 'Our <em>workshop</em>',
    body: `
      <p class="lead">Ember &amp; Iron started in 2018 in a small Lahore workshop with one welder, one anvil, and a stubborn idea: that fire deserves better tools.</p>
      <h2>How we make things</h2>
      <p>Every cookbox is hand-welded from 4mm steel. Cast iron is sand-cast at a foundry in Gujranwala that has been pouring metal since 1962. Wooden handles are turned from walnut offcuts in Sialkot.</p>
      <h2>Why collapsible</h2>
      <p>Most of our customers live in homes that weren't designed for backyards. Collapsible grills fold flat against a wall when not in use, then come back out for friends, weekends, and slow afternoons. Same fire, less footprint.</p>
      <h2>Where we are</h2>
      <p>Workshop visits welcome by appointment. Walton Road, Lahore.</p>
    `
  },
  faq: {
    eyebrow: 'Help',
    title: 'Frequently asked <em>questions</em>',
    body: `<div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">Do you deliver BBQ grills, charcoal and smokers across Pakistan?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>Yes — we deliver grills, smokers, charcoal and accessories across Pakistan, with free delivery in Lahore, Karachi and Islamabad on orders over Rs 12,000.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">Which grill is best for Eid, tikka parties and hosting?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>For Eid, tikka nights, festivals and hosting, our 30-inch collapsible grills with a grilling top give you the most cooking surface for chicken, koftas and beef tikka.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">Are your grills good for camping, picnics and outdoor adventures?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>Absolutely. Our collapsible charcoal grills fold flat and are light enough to carry for camping, picnics, beach trips and outdoor adventures.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">What charcoal or coal do you recommend for BBQ?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>We recommend our single-origin acacia lump charcoal for a clean, long, hot burn — perfect for BBQ, chicken tikka and low-and-slow smoking.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">Can I use a charcoal grill in winter?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>Yes — charcoal grilling is a winter favourite for warm gatherings. Our fire starters and handheld air blower get coals glowing fast even on cold evenings.</p></div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" onclick="toggleFaq(this)">Do your grills and smokers come with a warranty?<span class="faq-icon">+</span></button>
        <div class="faq-a"><p>Every hand-built cookbox carries a lifetime warranty against burn-through, and accessories carry a 1-year warranty.</p></div>
      </div>
    </div>`
  },
  contact: {
    eyebrow: 'Get in touch',
    title: 'Contact <em>us</em>',
    body: `<div class="contact-grid">
      <div class="contact-info">
        <div class="contact-block">
          <h3>Workshop</h3>
          <p>Walton Road<br>Lahore 54000, Pakistan</p>
        </div>
        <div class="contact-block">
          <h3>Phone</h3>
          <p>+92 42 1234 5678<br><span class="hours">Mon–Sat · 10am–7pm</span></p>
        </div>
        <div class="contact-block">
          <h3>WhatsApp</h3>
          <p>+92 300 1234 567</p>
        </div>
        <div class="contact-block">
          <h3>Email</h3>
          <p>hello@emberandiron.pk<br>support@emberandiron.pk</p>
        </div>
      </div>
      <form class="contact-form" id="contact-form" onsubmit="return submitContactForm(event)">
        <h3>Send us a note</h3>
        <div class="field">
          <label>Your name</label>
          <input type="text" id="ct-name" required>
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="ct-email" required>
        </div>
        <div class="field">
          <label>Subject</label>
          <select id="ct-subject">
            <option>General enquiry</option>
            <option>Order status</option>
            <option>Warranty claim</option>
            <option>Workshop visit</option>
            <option>Press</option>
          </select>
        </div>
        <div class="field">
          <label>Message</label>
          <textarea id="ct-message" rows="5" required></textarea>
        </div>
        <button type="submit" class="contact-submit">Send message</button>
      </form>
    </div>`
  }
};

function showPolicy(e, slug) {
  if (e) e.preventDefault();
  const page = POLICY_PAGES[slug];
  if (!page) return;
  document.getElementById('policy-eyebrow').textContent = page.eyebrow;
  document.getElementById('policy-title').innerHTML = page.title;
  document.getElementById('policy-body').innerHTML = page.body;
  switchView('view-policy', { slug });
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (item) item.classList.toggle('open');
}

function submitContactForm(e) {
  if (e) e.preventDefault();
  const name = (document.getElementById('ct-name')||{}).value || '';
  const email = (document.getElementById('ct-email')||{}).value || '';
  const msg = (document.getElementById('ct-message')||{}).value || '';
  if (!name.trim() || !email.trim() || !msg.trim()) {
    showToast('Please fill in name, email, and message');
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    showToast('Please enter a valid email');
    return false;
  }
  // In a real build this would POST to /contact. For now we capture in console.
  document.getElementById('contact-form').reset();
  showToast("Thanks — we'll reply within 48 hours.");
  return false;
}

function showShop(e, anchor) {
  if (e) e.preventDefault();
  const onShop = document.getElementById('view-shop').classList.contains('active');
  if (!onShop) switchView('view-shop');
  if (anchor) {
    setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 50);
  } else if (onShop) {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
}

// ===== Render featured products (4 grills) =====
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const items = featuredGrillIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);
  grid.innerHTML = items.map(p => productCardHtml(p, 'prod')).join('');
}

// ===== Render bundles =====
const BUNDLE_DISCOUNT = 0.10;   // a bundle costs its members' total minus this %
function renderPackages() {
  const grid = document.getElementById('bundles-grid');
  grid.innerHTML = packages.map(pkg => {
    const grill = products.find(p => p.id === pkg.grillId);
    const accessories = pkg.accessoryIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    // Live bundle pricing: sum current member prices, apply the bundle discount
    const memberSum = (grill ? grill.price : 0) + accessories.reduce((s, a) => s + a.price, 0);
    if (grill && grill.price > 0 && memberSum > 0) {
      pkg.originalPrice = memberSum;
      // Shopify is the bundle-price source of truth once synced; the 10%
      // formula is only the pre-sync / offline fallback.
      if (!pkg.shopifyPriced) pkg.price = Math.round(memberSum * (1 - BUNDLE_DISCOUNT) / 10) * 10;
    }
    const savings = pkg.originalPrice - pkg.price;
    const itemCount = 1 + accessories.length;
    return `
      <article class="bundle" id="pkg-${pkg.id}">
        <div class="bundle-tier">${pkg.tier}</div>
        <div class="bundle-art-frame">
          ${artSvg(pkg.art)}
          <span class="item-count">${itemCount} pieces</span>
        </div>
        <div class="bundle-meta">${pkg.id} · bundle</div>
        <h3>${pkg.name} <em>set</em></h3>
        <p class="desc">${pkg.desc}</p>
        <div class="bundle-includes">
          <h5>Includes ${itemCount}</h5>
          <ul>
            <li class="grill">${grill ? grill.name : ''}</li>
            ${accessories.map(a => `<li>${a.name}</li>`).join('')}
          </ul>
        </div>
        <div class="bundle-foot">
          <div class="bundle-prices">
            <div class="price-block">
              <div class="was">PKR ${fmt(pkg.originalPrice)}</div>
              <div class="now"><span class="ccy">PKR</span>${fmt(pkg.price)}</div>
            </div>
            <div class="bundle-savings">
              Save
              <span class="amt">PKR ${fmt(savings)}</span>
            </div>
          </div>
          <button class="bundle-add" onclick="addPackageToCart('${pkg.id}')">
            Add bundle to cart
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function addPackageToCart(pkgId) {
  const pkg = packages.find(p => p.id === pkgId);
  if (!pkg) return;
  if (cart[pkg.id]) {
    cart[pkg.id].qty += 1;
  } else {
    cart[pkg.id] = {
      id: pkg.id,
      name: pkg.name + ' Set',
      price: pkg.price,
      art: pkg.art,
      qty: 1,
      isPackage: true
    };
  }
  updateCartUI();
  showToast(`${pkg.name} Set added to your order`);
}

// ===== Category filter =====
// ===== Newsletter =====
const NEWSLETTER_STORAGE_KEY = 'ember-newsletter-emails';
function getSubscribedEmails() {
  try { return JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveSubscribedEmail(email) {
  const emails = getSubscribedEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    try { localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(emails)); } catch (e) {}
  }
}

function subscribe(id) {
  id = id || 'newsletter-email';
  const input = document.getElementById(id);
  if (!input) return;
  const email = input.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    showToast('Please enter a valid email address');
    input.focus();
    return;
  }
  const container = input.closest('.newsletter');
  if (getSubscribedEmails().includes(email)) {
    if (container) container.outerHTML = '<div class="newsletter-success">You\'re already on the list — thanks for being a regular.</div>';
    showToast('Already subscribed');
    return;
  }
  saveSubscribedEmail(email);
  // In a real build this would POST to a mailing-list provider (Mailchimp, Buttondown, etc.)
  if (container) container.outerHTML = '<div class="newsletter-success"><span class="check">✓</span> Subscribed. Look out for the next dispatch.</div>';
  showToast('Subscribed');
}

// ===== Mobile navigation =====
function openMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btns = document.querySelectorAll('.mobile-menu-btn');
  if (!nav) return;
  nav.classList.add('open');
  nav.setAttribute('aria-hidden', 'false');
  btns.forEach(b => { b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); });
  document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btns = document.querySelectorAll('.mobile-menu-btn');
  if (!nav) return;
  nav.classList.remove('open');
  nav.setAttribute('aria-hidden', 'true');
  btns.forEach(b => { b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); });
  document.body.style.overflow = '';
}

// ===== Keyboard close =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeSearch();
    closeMobileNav();
  }
});

// ===== View switching =====
const FREE_SHIPPING_THRESHOLD = 12000;
const SHIPPING_FEE = 1500;
const TAX_RATE = 0.17;

// ===== Promo / discount codes =====
const PROMO_CODES = {
  'EMBER10':  { type: 'percent', value: 10, desc: '10% off subtotal' },
  'BBQ500':   { type: 'flat',    value: 500, desc: 'PKR 500 off' },
  'WELCOME5': { type: 'percent', value: 5,   desc: '5% off your first order' }
};
let appliedPromo = null;

function applyPromo() {
  const input = document.getElementById('promo-input');
  const feedback = document.getElementById('promo-feedback');
  if (!input || !feedback) return;
  const raw = (input.value || '').trim().toUpperCase();
  if (!raw) {
    feedback.className = 'promo-feedback err';
    feedback.textContent = 'Enter a code';
    input.classList.add('error');
    return;
  }
  const code = PROMO_CODES[raw];
  if (!code) {
    feedback.className = 'promo-feedback err';
    feedback.textContent = 'Invalid promo code';
    input.classList.add('error');
    return;
  }
  appliedPromo = { code: raw, type: code.type, value: code.value, desc: code.desc };
  input.classList.remove('error');
  input.value = '';
  feedback.className = 'promo-feedback ok';
  feedback.textContent = 'Code applied';
  renderCheckoutSummary();
}

function removePromo() {
  appliedPromo = null;
  const fb = document.getElementById('promo-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'promo-feedback'; }
  renderCheckoutSummary();
}

// ===== Routing (History API) =====
const ROUTES = {
  'view-shop':        { path: '/' },
  'view-accessories': { path: '/accessories' },
  'view-wishlist':    { path: '/wishlist' },
  'view-success':     { path: '/order-confirmed' },
  'view-orders':      { path: '/orders' },
  'view-product':     { path: null }  // dynamic by id
};
function currentPath() {
  return (window.location.pathname || '/').replace(/\/index\.html$/, '/');
}
function pushRoute(viewId, slug) {
  let path;
  if (viewId === 'view-policy' && slug) path = '/' + slug;
  else if (viewId === 'view-product' && slug) path = '/product/' + slug;
  else path = (ROUTES[viewId] || {}).path;
  if (!path) return;
  if (currentPath() === path) return;
  try {
    history.pushState({ viewId, slug }, '', path + window.location.search);
  } catch (e) {}
}
function viewFromPath(path) {
  for (const [vid, def] of Object.entries(ROUTES)) {
    if (def.path === path) return { viewId: vid };
  }
  const slug = path.replace(/^\//, '');
  const prodMatch = path.match(/^\/product\/(.+)$/);
  if (prodMatch && products.some(p => p.id === prodMatch[1])) {
    return { viewId: 'view-product', slug: prodMatch[1] };
  }
  if (typeof POLICY_PAGES !== 'undefined' && POLICY_PAGES[slug]) {
    return { viewId: 'view-policy', slug };
  }
  // Don't treat the local dev path as a 404 — only treat non-root paths we don't recognise
  if (path === '/' || /\.html$/.test(path)) return null;
  return { viewId: 'view-404' };
}
function applyRouteContent(m) {
  if (m.viewId === 'view-policy' && m.slug) {
    const page = POLICY_PAGES[m.slug];
    if (page) {
      document.getElementById('policy-eyebrow').textContent = page.eyebrow;
      document.getElementById('policy-title').innerHTML = page.title;
      document.getElementById('policy-body').innerHTML = page.body;
    }
  } else if (m.viewId === 'view-product' && m.slug) {
    const p = products.find(x => x.id === m.slug);
    if (p) renderProduct(p);
  }
}
function initRouter() {
  // If the loaded URL matches a known route, jump there on first paint.
  const match = viewFromPath(currentPath());
  if (match) {
    applyRouteContent(match);
    switchView(match.viewId, { skipRoute: true });
  }
  window.addEventListener('popstate', () => {
    const m = viewFromPath(currentPath());
    if (!m) return;
    applyRouteContent(m);
    switchView(m.viewId, { skipRoute: true });
  });
}

function switchView(id, opts) {
  opts = opts || {};
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  trackPageView(id);
  if (!opts.skipRoute) pushRoute(id, opts.slug);
}

// ===== Cookie consent + analytics scaffolding =====
const COOKIE_CONSENT_KEY = 'ember-cookie-consent';
function getCookieConsent() {
  try { return localStorage.getItem(COOKIE_CONSENT_KEY); }
  catch (e) { return null; }
}
function setCookieConsent(choice) {
  try { localStorage.setItem(COOKIE_CONSENT_KEY, choice); } catch (e) {}
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.classList.remove('show');
  if (choice === 'accept') initAnalytics();
  else console.log('[analytics] declined — no tracking will fire');
}
function showCookieBannerIfNeeded() {
  if (getCookieConsent()) return;
  const banner = document.getElementById('cookie-banner');
  if (banner) setTimeout(() => banner.classList.add('show'), 600);
}

// Lightweight analytics shim. A real build would inject GA4/Plausible/etc. here.
function initAnalytics() {
  if (window.__analyticsInited) return;
  window.__analyticsInited = true;
  console.log('[analytics] initialised (consent: accept)');
  // Track the current view as the first page view
  const active = (document.querySelector('.view.active') || {}).id;
  if (active) trackPageView(active);
}
function trackPageView(viewId) {
  if (getCookieConsent() !== 'accept') return;
  console.log('[analytics] page view:', viewId || 'unknown');
}

// Checkout goes straight to Shopify's hosted checkout (no custom checkout page).
async function showCheckout() {
  const items = Object.values(cart);
  if (items.length === 0) return;
  const btn = document.getElementById('checkout-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Taking you to checkout…'; }
  let url = null;
  try { url = await createShopifyCart(); }
  catch (e) { console.warn('[checkout] Shopify cart failed', e); }
  if (url) { window.location.href = url; return; }   // → Shopify-hosted checkout
  // No matching Shopify variants (store not configured / unreachable)
  showToast('Checkout is unavailable right now — please try again shortly.');
  if (btn) { btn.disabled = false; btn.textContent = 'Proceed to checkout'; }
}

function backToShop() {
  switchView('view-shop');
}

function renderCheckoutSummary() {
  const items = Object.values(cart);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  // Discount
  let discount = 0;
  if (appliedPromo) {
    discount = appliedPromo.type === 'percent'
      ? Math.round(subtotal * appliedPromo.value / 100)
      : appliedPromo.value;
    if (discount > subtotal) discount = subtotal;
  }
  const discounted = subtotal - discount;
  const shipping = discounted >= FREE_SHIPPING_THRESHOLD ? 0 : (items.length ? SHIPPING_FEE : 0);
  const tax = Math.round(discounted * TAX_RATE);
  const total = discounted + shipping + tax;

  document.getElementById('summary-items').innerHTML = items.map(i => `
    <div class="summary-item">
      <div class="summary-item-art">${mediaFor(i)}</div>
      <div class="summary-item-info">
        <div class="name">${i.name}</div>
        <div class="qty">QTY ${i.qty} · ${i.id}</div>
      </div>
      <div class="summary-item-price">PKR ${fmt(i.qty * i.price)}</div>
    </div>
  `).join('');

  document.getElementById('co-subtotal').textContent = `PKR ${fmt(subtotal)}`;
  document.getElementById('co-shipping').innerHTML = shipping === 0
    ? '<span class="ember-text">Free</span>'
    : `PKR ${fmt(shipping)}`;
  document.getElementById('co-tax').textContent = `PKR ${fmt(tax)}`;
  document.getElementById('co-total').textContent = `PKR ${fmt(total)}`;

  // Promo UI state
  const promoRow = document.getElementById('promo-row');
  const promoApplied = document.getElementById('promo-applied');
  const discountRow = document.getElementById('co-discount-row');
  if (appliedPromo) {
    if (promoRow) promoRow.style.display = 'none';
    if (promoApplied) {
      promoApplied.style.display = 'flex';
      document.getElementById('promo-code-text').textContent = appliedPromo.code;
      document.getElementById('promo-desc-text').textContent = appliedPromo.desc;
    }
    if (discountRow) {
      discountRow.style.display = 'flex';
      document.getElementById('co-discount-code').textContent = `(${appliedPromo.code})`;
      document.getElementById('co-discount').textContent = `− PKR ${fmt(discount)}`;
    }
  } else {
    if (promoRow) promoRow.style.display = 'flex';
    if (promoApplied) promoApplied.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
  }
}

// Payment method toggle
document.querySelectorAll('.pay-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type="radio"]').checked = true;
    const method = opt.dataset.method;
    document.getElementById('card-fields').classList.toggle('show', method === 'card');
  });
});

// ===== Checkout field validation =====
const VALIDATORS = {
  'co-email': v => {
    const t = v.trim();
    if (!t) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'Enter a valid email address';
    return '';
  },
  'co-phone': v => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return 'Phone is required';
    if (digits.length < 9) return 'Enter a valid phone number';
    return '';
  },
  'co-fname': v => v.trim() ? '' : 'First name is required',
  'co-lname': v => v.trim() ? '' : 'Last name is required',
  'co-addr':  v => v.trim().length >= 4 ? '' : 'Enter a valid street address',
  'co-zip':   v => {
    const t = v.trim();
    if (!t) return 'Postal code is required';
    if (!/^[A-Za-z0-9\- ]{3,10}$/.test(t)) return 'Enter a valid postal code';
    return '';
  }
};

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const errEl = document.getElementById(id + '-err');
  const validator = VALIDATORS[id];
  if (!validator) return true;
  const msg = validator(el.value);
  if (msg) {
    el.classList.add('error');
    if (errEl) errEl.textContent = msg;
    return false;
  }
  el.classList.remove('error');
  if (errEl) errEl.textContent = '';
  return true;
}

function setupValidationListeners() {
  Object.keys(VALIDATORS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => validateField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(id);
    });
  });
}

function placeOrder() {
  // If Shopify products are loaded, redirect to Shopify-hosted checkout
  const cartItems = Object.values(cart).filter(i => !i.isPackage);
  const allHaveVariants = cartItems.length > 0 &&
    cartItems.every(i => shopifyVariantIds[i.id]);

  if (allHaveVariants) {
    const btn = document.querySelector('button.place-order');
    if (btn) { btn.disabled = true; btn.textContent = 'Redirecting to Shopify…'; }
    createShopifyCart().then(url => {
      if (url) {
        window.location.href = url;
      } else {
        showToast('Could not create Shopify checkout — please try again');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Checkout with Shopify <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
        }
      }
    });
    return;
  }

  // Fallback: simulated checkout (no Shopify products configured yet)
  let ok = true;
  let firstErrorEl = null;
  Object.keys(VALIDATORS).forEach(id => {
    const valid = validateField(id);
    if (!valid) {
      ok = false;
      if (!firstErrorEl) firstErrorEl = document.getElementById(id);
    }
  });
  if (!ok) {
    showToast('Please fix the highlighted fields');
    if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // If paying by card, run card validation too
  if (getCardPaymentMethod() === 'card' && !validateCardFields()) {
    showToast('Please check your card details');
    document.querySelector('#card-fields input.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // Build the order
  const items = Object.values(cart);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  let discount = 0;
  if (appliedPromo) {
    discount = appliedPromo.type === 'percent'
      ? Math.round(subtotal * appliedPromo.value / 100)
      : appliedPromo.value;
    if (discount > subtotal) discount = subtotal;
  }
  const discounted = subtotal - discount;
  const shipping = discounted >= FREE_SHIPPING_THRESHOLD ? 0 : (items.length ? SHIPPING_FEE : 0);
  const tax = Math.round(discounted * TAX_RATE);
  const total = discounted + shipping + tax;
  const ref = 'EMB-' + Math.floor(100000 + Math.random() * 900000);
  const order = {
    ref, date: new Date().toISOString(),
    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, art: i.art })),
    subtotal, discount, shipping, tax, total,
    promo: appliedPromo ? appliedPromo.code : null,
    customer: {
      email: (document.getElementById('co-email').value || '').trim(),
      fname: (document.getElementById('co-fname').value || '').trim(),
      lname: (document.getElementById('co-lname').value || '').trim(),
      phone: (document.getElementById('co-phone').value || '').trim(),
      address: (document.getElementById('co-addr').value || '').trim(),
      address2: (document.getElementById('co-addr2').value || '').trim(),
      city: document.getElementById('co-city').value,
      zip: (document.getElementById('co-zip').value || '').trim(),
      notes: (document.getElementById('co-notes').value || '').trim()
    },
    payment: ((document.querySelector('.pay-opt.selected') || {}).dataset || {}).method || 'card'
  };
  saveOrder(order);
  sendOrderEmail(order);
  document.getElementById('order-ref').textContent = ref;
  // Clear cart and applied promo
  cart = {};
  appliedPromo = null;
  updateCartUI();
  switchView('view-success');
}

// ===== Payment: client-side card validation + formatting =====
// In production, raw card data would go to Stripe Elements / a PCI-compliant tokenizer;
// these helpers only sanity-check input before we'd hand it off.
function luhn(num) {
  const s = (num || '').replace(/\D/g, '');
  if (s.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}
function detectCardBrand(num) {
  const s = (num || '').replace(/\D/g, '');
  if (/^4/.test(s)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(s)) return 'Mastercard';
  if (/^3[47]/.test(s)) return 'Amex';
  if (/^6(?:011|5)/.test(s)) return 'Discover';
  return '';
}
function formatCardNumber(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(value) {
  let d = (value || '').replace(/\D/g, '').slice(0, 4);
  if (d.length >= 3) d = d.slice(0, 2) + ' / ' + d.slice(2);
  return d;
}
function validateExpiry(value) {
  const m = (value || '').replace(/\s/g, '').match(/^(\d{2})\/?(\d{2})$/);
  if (!m) return false;
  const mm = parseInt(m[1], 10);
  const yy = parseInt(m[2], 10);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const cardYear = 2000 + yy;
  const cardEnd = new Date(cardYear, mm); // start of next month
  return cardEnd > now;
}
function getCardPaymentMethod() {
  return ((document.querySelector('.pay-opt.selected') || {}).dataset || {}).method;
}
function attachCardFormatters() {
  const num = document.getElementById('card-number');
  const exp = document.getElementById('card-expiry');
  const cvc = document.getElementById('card-cvc');
  if (num) {
    num.addEventListener('input', () => {
      const pos = num.selectionStart;
      num.value = formatCardNumber(num.value);
      const brand = detectCardBrand(num.value);
      const badge = document.getElementById('card-brand');
      if (badge) badge.textContent = brand;
      try { num.setSelectionRange(pos + 1, pos + 1); } catch (e) {}
      clearCardErr('card-number');
    });
  }
  if (exp) {
    exp.addEventListener('input', () => { exp.value = formatExpiry(exp.value); clearCardErr('card-expiry'); });
  }
  if (cvc) {
    cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); clearCardErr('card-cvc'); });
  }
}
function clearCardErr(id) {
  const el = document.getElementById(id);
  if (el && el.classList.contains('error')) {
    el.classList.remove('error');
    const err = document.getElementById(id + '-err');
    if (err) err.textContent = '';
  }
}
function validateCardFields() {
  const set = (id, msg) => {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + '-err');
    if (msg) { el?.classList.add('error'); if (errEl) errEl.textContent = msg; return false; }
    el?.classList.remove('error'); if (errEl) errEl.textContent = '';
    return true;
  };
  let ok = true;
  const num = document.getElementById('card-number').value;
  if (!luhn(num)) ok = set('card-number', 'Enter a valid card number') && ok;
  else ok = set('card-number', '') && ok;
  const name = document.getElementById('card-name').value.trim();
  if (!name) ok = set('card-name', 'Cardholder name is required') && ok;
  else ok = set('card-name', '') && ok;
  const exp = document.getElementById('card-expiry').value;
  if (!validateExpiry(exp)) ok = set('card-expiry', 'Enter a valid future expiry (MM/YY)') && ok;
  else ok = set('card-expiry', '') && ok;
  const cvc = document.getElementById('card-cvc').value;
  const brand = detectCardBrand(num);
  const cvcLen = brand === 'Amex' ? 4 : 3;
  if (!new RegExp('^\\d{' + cvcLen + '}$').test(cvc)) ok = set('card-cvc', `CVC must be ${cvcLen} digits`) && ok;
  else ok = set('card-cvc', '') && ok;
  return ok;
}

// Pretend gateway hand-off (this is where Stripe/Adyen/Razorpay would tokenize the card)
function processCardPayment(amount, card) {
  // Simulated 200ms latency, always succeeds in this demo
  return new Promise(resolve => setTimeout(() => resolve({ success: true, txn: 'TXN_' + Date.now() }), 200));
}

// ===== Order persistence + email =====
const ORDERS_STORAGE_KEY = 'ember-orders-v1';
function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveOrder(order) {
  try {
    const all = getOrders();
    all.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
  } catch (e) {}
}
function getOrderByRef(ref) {
  return getOrders().find(o => o.ref.toLowerCase() === (ref || '').toLowerCase());
}
function sendOrderEmail(order) {
  // Stub. In production this would POST to a transactional mail service.
  const o = order;
  const lines = [
    '====================================',
    '  Order confirmation email (stub)   ',
    '====================================',
    `To: ${o.customer.email}`,
    `Subject: Your Ember & Iron order ${o.ref}`,
    '',
    `Hi ${o.customer.fname},`,
    '',
    `Thanks for your order — we've started preparing it in the workshop.`,
    '',
    `Order #${o.ref}`,
    ...o.items.map(i => `  ${i.qty} × ${i.name}  —  PKR ${fmt(i.qty * i.price)}`),
    '',
    `Subtotal: PKR ${fmt(o.subtotal)}`,
    o.discount ? `Discount (${o.promo}): − PKR ${fmt(o.discount)}` : null,
    `Shipping: ${o.shipping ? 'PKR ' + fmt(o.shipping) : 'Free'}`,
    `GST (17%): PKR ${fmt(o.tax)}`,
    `Total: PKR ${fmt(o.total)}`,
    '',
    `Delivery to:`,
    `${o.customer.fname} ${o.customer.lname}`,
    `${o.customer.address}${o.customer.address2 ? ', ' + o.customer.address2 : ''}`,
    `${o.customer.city} ${o.customer.zip}`,
    '',
    `We'll send a tracking link once it ships. Reply to this email if anything's off.`,
    '— Ember & Iron'
  ].filter(Boolean).join('\n');
  console.log(lines);
}

// ===== Order history view =====
function showOrders(e) {
  if (e) e.preventDefault();
  renderOrders();
  switchView('view-orders');
}
function renderOrders() {
  const list = document.getElementById('orders-list');
  if (!list) return;
  const orders = getOrders();
  if (orders.length === 0) {
    list.innerHTML = `
      <div class="orders-empty">
        <div class="big">No orders yet.</div>
        <div class="small">Your past orders will appear here</div>
        <button type="button" class="btn-shop" onclick="goHome()">Start a cookout</button>
      </div>`;
    return;
  }
  list.innerHTML = orders.map(o => `
    <article class="order-card" onclick="showOrderDetail('${o.ref}')">
      <div class="order-card-head">
        <div>
          <div class="order-ref">${o.ref}</div>
          <div class="order-date">${new Date(o.date).toLocaleDateString('en-PK', {day:'numeric', month:'short', year:'numeric'})}</div>
        </div>
        <div class="order-total"><span class="ccy">PKR</span>${fmt(o.total)}</div>
      </div>
      <div class="order-card-body">
        ${o.items.slice(0, 4).map(i => `<span class="order-item-pill">${i.qty}× ${i.name}</span>`).join('')}
        ${o.items.length > 4 ? `<span class="order-item-pill more">+${o.items.length - 4} more</span>` : ''}
      </div>
    </article>
  `).join('');
}
function showOrderDetail(ref) {
  const o = getOrderByRef(ref);
  if (!o) { showToast('Order not found'); return; }
  const wrap = document.getElementById('order-detail-content');
  wrap.innerHTML = `
    <div class="order-detail-head">
      <button class="policy-back" onclick="showOrders(event)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
        Back to orders
      </button>
      <div class="policy-eyebrow">Order ${o.ref}</div>
      <h1>Your <em>order</em></h1>
      <p class="order-date-big">Placed ${new Date(o.date).toLocaleDateString('en-PK', {day:'numeric', month:'long', year:'numeric'})}</p>
    </div>
    <div class="order-detail-grid">
      <div class="order-items">
        <h3>Items</h3>
        ${o.items.map(i => `
          <div class="order-detail-item">
            <div class="order-detail-art">${mediaFor(i)}</div>
            <div class="order-detail-info">
              <div class="name">${i.name}</div>
              <div class="qty">QTY ${i.qty} · ${i.id}</div>
            </div>
            <div class="order-detail-price">PKR ${fmt(i.qty * i.price)}</div>
          </div>
        `).join('')}
      </div>
      <div class="order-side">
        <div class="order-side-block">
          <h3>Totals</h3>
          <div class="totals-row"><span>Subtotal</span><span>PKR ${fmt(o.subtotal)}</span></div>
          ${o.discount ? `<div class="totals-row"><span>Discount (${o.promo})</span><span class="ember-text">− PKR ${fmt(o.discount)}</span></div>` : ''}
          <div class="totals-row"><span>Shipping</span><span>${o.shipping ? 'PKR ' + fmt(o.shipping) : '<span class="ember-text">Free</span>'}</span></div>
          <div class="totals-row"><span>GST (17%)</span><span>PKR ${fmt(o.tax)}</span></div>
          <div class="totals-row grand"><span class="label">Total</span><span>PKR ${fmt(o.total)}</span></div>
        </div>
        <div class="order-side-block">
          <h3>Delivery</h3>
          <p>${o.customer.fname} ${o.customer.lname}<br>
          ${o.customer.address}${o.customer.address2 ? '<br>' + o.customer.address2 : ''}<br>
          ${o.customer.city} ${o.customer.zip}<br>
          ${o.customer.phone}</p>
        </div>
        <div class="order-side-block">
          <h3>Payment</h3>
          <p>${o.payment === 'cod' ? 'Cash on delivery' : o.payment === 'bank' ? 'Bank transfer' : 'Card'}</p>
        </div>
      </div>
    </div>`;
  switchView('view-order-detail');
}
function lookupOrder() {
  const input = document.getElementById('track-order-input');
  if (!input) return;
  const ref = input.value.trim();
  if (!ref) { showToast('Enter your order reference'); input.focus(); return; }
  const o = getOrderByRef(ref);
  if (!o) { showToast('No order found with that reference'); return; }
  showOrderDetail(o.ref);
}

// ===== View switching end =====

// ===== Search =====
const categoryLabels = {
  grills: 'Grills',
  accessories: 'Accessories'
};

let activeSearchCategory = null;

function openSearch(category = null) {
  activeSearchCategory = category;
  document.getElementById('search-backdrop').classList.add('open');
  document.getElementById('search-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('search-input').value = '';
  setTimeout(() => {
    if (!category) document.getElementById('search-input').focus();
    runSearch('');
  }, 50);
}

function closeSearch() {
  document.getElementById('search-backdrop').classList.remove('open');
  document.getElementById('search-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('search-input').value = '';
  activeSearchCategory = null;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function runSearch(query) {
  const q = query.trim().toLowerCase();

  // Build candidate list — start with category filter if active
  let candidates = activeSearchCategory
    ? products.filter(p => p.cat === activeSearchCategory)
    : products;

  const matches = q === ''
    ? candidates
    : candidates.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );

  const status = document.getElementById('search-status');
  let statusText;
  if (activeSearchCategory && q === '') {
    statusText = `${categoryLabels[activeSearchCategory] || activeSearchCategory} <span class="count">· ${matches.length}</span>`;
  } else if (q === '') {
    statusText = `All products <span class="count">· ${products.length}</span>`;
  } else {
    statusText = `Results for "${query}" <span class="count">· ${matches.length}</span>`;
  }
  status.innerHTML = statusText;

  const container = document.getElementById('search-grid-container');
  if (matches.length === 0) {
    container.innerHTML = `
      <div class="search-empty">
        <div class="big">Nothing matches "${query}"</div>
        <div class="small">Try grills or accessories</div>
      </div>`;
    return;
  }
  container.innerHTML = `<div class="search-grid">
    ${matches.map(p => `
      <button class="search-result" onclick="jumpToProduct('${p.id}')">
        <div class="search-result-art">${mediaFor(p)}</div>
        <div class="search-result-info">
          <div class="search-result-meta">${p.id} · ${p.cat}</div>
          <div class="search-result-name">${highlightMatch(p.name, q)}</div>
          <div class="search-result-desc">${highlightMatch(p.desc, q)}</div>
        </div>
        <div class="search-result-price"><span class="ccy">PKR</span>${fmt(p.price)}</div>
      </button>
    `).join('')}
  </div>`;
}

function jumpToProduct(id) {
  closeSearch();
  // Open the product's detail page (works for every product, grill or accessory)
  showProduct(null, id);
}

// Search input live filtering
document.getElementById('search-input').addEventListener('input', (e) => {
  runSearch(e.target.value);
});

// ===== Home button =====
function goHome() {
  if (!document.getElementById('view-shop').classList.contains('active')) {
    switchView('view-shop');
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function filterAccessories(e) {
  e.preventDefault();
  openSearch('accessories');
}

// Init
loadWishlist();
loadRecent();
renderProducts();
renderPackages();
renderAccessories();
loadCart();
loadShopifyProducts(); // fetch live prices, stock + variant IDs from Shopify
updateCartUI();
updateWishlistUI();
renderRecentlyViewed();
showCookieBannerIfNeeded();
if (getCookieConsent() === 'accept') initAnalytics();
initRouter();

// Hero video: DEFER loading until after first paint so the 3 MB clip doesn't
// block the initial page load. The warm "forge" gradient placeholder shows
// instantly; the video then streams in and plays.
(function(){
  const v = document.getElementById('hero-video');
  if (!v) return;
  v.muted = true;
  let started = false;
  const startVideo = () => {
    if (started) return; started = true;
    const src = v.querySelector('source[data-src]');
    if (src && !src.src) {
      // Phones get the portrait render (1080x1920) when one is provided
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const mSrc = src.getAttribute('data-src-mobile');
      src.src = (mobile && mSrc) ? mSrc : src.getAttribute('data-src');
      const mPoster = v.getAttribute('data-poster-mobile');
      if (mobile && mPoster) v.poster = mPoster;
    }
    v.preload = 'auto';
    v.load();
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  };
  const tryPlay = () => { if (!started) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  // Kick off only after the page has fully loaded (or on idle), not during render
  const schedule = () => (window.requestIdleCallback
    ? requestIdleCallback(startVideo, { timeout: 1500 })
    : setTimeout(startVideo, 300));
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
  // Pause when scrolled well past the hero to save resources; resume when back
  window.addEventListener('scroll', () => {
    if (!document.getElementById('view-shop').classList.contains('active')) return;
    if (window.scrollY > window.innerHeight * 1.2) { v.pause(); }
    else if (v.paused) { tryPlay(); }
  }, { passive: true });
})();

// Re-render after deferred product-images.js has loaded so photos appear in place of placeholder SVGs
document.addEventListener('DOMContentLoaded', () => {
  if (!window.PRODUCT_IMAGES || !Object.keys(window.PRODUCT_IMAGES).length) return;
  renderProducts();
  renderAccessories();
  if (document.getElementById('view-wishlist').classList.contains('active')) renderWishlist();
});

// Back-to-top button visibility
(function(){
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      btn.classList.toggle('show', window.scrollY > 500);
      ticking = false;
    });
  }, { passive: true });
})();

// ---- Motion layer: scroll reveals ----
// Classes are added here, not in the markup, so a no-JS load (and crawlers)
// see the page fully rendered. Skipped entirely under reduced motion.
(function(){
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-motion');

  document.querySelectorAll('.module-head, .editorial-inner > div:first-child, .footer-cta')
    .forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.products, .bundles-grid, .howto-grid, .editorial-stats')
    .forEach(el => el.classList.add('reveal-group'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-group').forEach(el => io.observe(el));

  // Safety net: tall grids (taller than ~8x the viewport slice a phone shows)
  // and SPA view switches can slip past the observer — force-reveal anything
  // still hidden shortly after a view becomes active.
  const pinActive = () => {
    document.querySelectorAll('.view.active .reveal:not(.in), .view.active .reveal-group:not(.in)')
      .forEach(el => el.classList.add('in'));
  };
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.target.classList && m.target.classList.contains('view') && m.target.classList.contains('active')) {
        setTimeout(pinActive, 350);
        return;
      }
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();

// ---- Hero ember drift ----
// A sparse canvas of rising embers between the video and the headline.
// Deferred to idle (same first-paint budget rule as the hero video), paused
// when the hero is off-screen or the tab is hidden.
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero.hero-video');
  if (!hero) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-embers';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.querySelector('.hero-text'));
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const palette = ['--ember', '--flame', '--amber']
    .map(v => css.getPropertyValue(v).trim())
    .filter(c => /^#[0-9a-f]{6}$/i.test(c));
  if (!palette.length) palette.push('#E8571F');

  let W = 0, H = 0;
  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const parts = [];
  const spawn = (anywhere) => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 8,
    r: 0.9 + Math.random() * 1.9,
    v: 14 + Math.random() * 30,
    amp: 8 + Math.random() * 20,
    ph: Math.random() * Math.PI * 2,
    fl: 1 + Math.random() * 2.5,
    a: 0.22 + Math.random() * 0.4,
    col: palette[Math.floor(Math.random() * palette.length)],
    t: 0,
  });

  let running = false, raf = 0, last = 0, heroVisible = true;
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.t += dt;
      p.y -= p.v * dt;
      if (p.y < -10) { parts[i] = spawn(false); continue; }
      const x = p.x + Math.sin(p.t * 0.9 + p.ph) * p.amp;
      const flick = 0.7 + 0.3 * Math.sin(p.t * p.fl * 6.28 + p.ph);
      const rise = Math.min(p.t / 1.2, 1);                          // ease in after spawn
      const headroom = Math.min(Math.max(p.y / (H * 0.3), 0), 1);   // fade near the top
      ctx.globalAlpha = p.a * flick * rise * headroom;
      const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 3);
      g.addColorStop(0, p.col);
      g.addColorStop(1, p.col + '00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r * 3, 0, 6.29);
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  };
  const play = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const sync = () => ((heroVisible && !document.hidden) ? play() : stop());

  const start = () => {
    size();
    for (let i = 0; i < 22; i++) parts.push(spawn(true));
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { heroVisible = en[0].isIntersecting; sync(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
    sync();
  };
  const schedule = () => (window.requestIdleCallback
    ? requestIdleCallback(start, { timeout: 2000 })
    : setTimeout(start, 400));
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
