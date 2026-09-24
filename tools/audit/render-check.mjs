// Rendered-page audit: loads real storefront pages in headless Chromium and
// fails on anything a shopper or Google would trip over.
//
//   node tools/audit/render-check.mjs                    # live store
//   node tools/audit/render-check.mjs --theme <id>       # unpublished theme via Shopify preview
//   node tools/audit/render-check.mjs --base <url>       # any other origin (e.g. local http.server)
//
// Checks per page: HTTP status, uncaught JS errors, console errors, JSON-LD
// parses, same-origin requests that 4xx/5xx, and tracking ownership (the
// Google & YouTube app pixel present, no hand-coded gtag.js alongside it —
// two tags double-count conversions). Exit code 1 on any failure.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.error('render-check: playwright not found'); process.exit(2); }

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = (opt('--base', 'https://emberandiron.pk')).replace(/\/$/, '');
const themeId = opt('--theme', null);
const expectAppTag = !args.includes('--no-app-tag') && !opt('--base', null);
const pages = (opt('--pages', null) || [
  '/', '/products/24-collapsible-grill-with-grilling-top', '/collections/all',
  '/cart', '/search?q=grill', '/pages/contact',
  '/policies/privacy-policy', '/policies/refund-policy', '/policies/terms-of-service',
].join(',')).split(',');

const launch = { args: [] };
if (process.env.PW_CHROMIUM) launch.executablePath = process.env.PW_CHROMIUM;
if (process.env.HTTPS_PROXY && !opt('--base', null)) launch.proxy = { server: process.env.HTTPS_PROXY };
// Claude Code cloud sessions re-terminate TLS at an egress proxy whose CA
// Chromium doesn't read from the system store. Trust exactly that CA (pinned
// by its public key) — every other certificate is still verified normally.
{
  const fs = require('node:fs'), crypto = require('node:crypto');
  const ca = '/root/.ccr/agent-proxy-ca.crt';
  if (launch.proxy && fs.existsSync(ca)) {
    const spki = new crypto.X509Certificate(fs.readFileSync(ca)).publicKey.export({ type: 'spki', format: 'der' });
    launch.args.push(`--ignore-certificate-errors-spki-list=${crypto.createHash('sha256').update(spki).digest('base64')}`);
  }
}
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (EmberIronAudit)' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const origin = new URL(base).origin;
const failures = [];
const warnings = new Set(); // third-party request failures: reported, not fatal
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

// Console noise from third parties we don't control (Shopify's own scripts,
// browser extensions, analytics beacons) is reported but not counted.
const THIRD_PARTY = /shopify|monorail|trekkie|facebook|google|doubleclick|web-pixels|sandbox/i;

if (themeId) {
  const p = await ctx.newPage();
  await p.goto(`${base}/?preview_theme_id=${themeId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.close();
}

for (const path of pages) {
  const p = await ctx.newPage();
  const errs = [], badReqs = [];
  p.on('pageerror', e => errs.push(`JS error: ${e.message}`));
  // "Failed to load resource" duplicates the response handler below, which knows the URL.
  p.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource') && !THIRD_PARTY.test(m.location()?.url || '') && !THIRD_PARTY.test(m.text())) errs.push(`console.error: ${m.text().slice(0, 200)}`); });
  p.on('response', r => {
    const u = r.url(); if (r.status() < 400) return;
    if (u.startsWith(origin) && !/\/(monorail|\.well-known|api\/collect|sf_private|web-pixels)/.test(u)) badReqs.push(`${r.status()} ${u.replace(origin, '')}`);
    else warnings.add(`${r.status()} ${u.slice(0, 120)}`);
  });

  let resp;
  for (let attempt = 0; attempt < 4; attempt++) {
    resp = await p.goto(base + path, { waitUntil: 'load', timeout: 60000 }).catch(e => ({ status: () => 0, err: e }));
    if (resp.status() !== 429) break;
    await sleep(4000 * (attempt + 1));
  }
  await sleep(1500);
  const status = resp.status();
  if (status >= 400 || status === 0) {
    fail(path, `HTTP ${status}${resp.err ? ' ' + resp.err.message.split('\n')[0] : ''}`);
    console.log(`${String(status).padEnd(4)} ${path}`);
    await p.close(); await sleep(1200); continue;
  }

  const info = await p.evaluate(() => ({
    themeId: window.Shopify && Shopify.theme && Shopify.theme.id,
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
    title: document.title,
  })).catch(e => ({ evalError: e.message }));
  if (info.evalError) { fail(path, `could not inspect page: ${info.evalError}`); await p.close(); continue; }
  // Tracking checks read the SERVER html, not the live DOM: the Google & YouTube
  // app injects gtag.js at runtime, which is correct and must not be flagged.
  // Fetched separately (same cookies → same preview theme): a page that
  // JS-redirects (e.g. /cart) discards its original response body.
  const raw = await ctx.request.get(base + path).then(r => r.text()).catch(() => '');
  if (!raw) fail(path, 'could not fetch server HTML for tracking checks');
  info.manualGtag = [...raw.matchAll(/<script[^>]+src=["'][^"']*googletagmanager\.com\/gtag\/js[^"']*/gi)].map(m => m[0].replace(/.*src=["']/, ''));
  info.appTag = /google_tag_ids/.test(raw);
  // Redirect stubs (e.g. templates/cart.liquid → /?cart=open) use {% layout none %}
  // and legitimately carry no pixel; the page they land on is checked instead.
  if (/http-equiv=["']refresh["']/i.test(raw)) info.appTag = true;

  if (themeId && String(info.themeId) !== String(themeId)) fail(path, `served theme ${info.themeId}, expected preview ${themeId} (preview cookie lost?)`);
  info.ld.forEach((t, i) => { try { JSON.parse(t); } catch (e) { fail(path, `JSON-LD block ${i + 1} invalid: ${e.message}`); } });
  if (info.manualGtag.length) fail(path, `hand-coded gtag.js present (${info.manualGtag.join(', ')}) — Google & YouTube app already tags the store; this double-counts conversions`);
  if (expectAppTag && !info.appTag) fail(path, 'Google & YouTube app pixel (google_tag_ids) missing — is {{ content_for_header }} in the layout?');
  errs.forEach(e => fail(path, e));
  badReqs.forEach(r => fail(path, `request failed: ${r}`));
  console.log(`${String(status).padEnd(4)} ${path.padEnd(52)} theme=${info.themeId} ld=${info.ld.length} "${(info.title || '').slice(0, 50)}"`);
  await p.close();
  await sleep(1200);
}
await browser.close();

if (warnings.size) {
  console.log(`\nThird-party request failures (not counted):`);
  warnings.forEach(w => console.log('  ! ' + w));
}
if (failures.length) {
  console.log(`\nRENDER AUDIT FAILED (${failures.length}):`);
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nRENDER AUDIT PASSED');
