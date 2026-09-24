// Static audit: offline, ~1s. Catches the mistakes that have actually shipped
// (or nearly shipped) on this project, before anything is handed over:
//   - JS syntax errors (one stray comma blanks the whole store)
//   - broken JSON-LD (Google silently drops it)
//   - unbalanced Liquid blocks (Shopify refuses the save, or renders garbage)
//   - a layout missing {{ content_for_header }} / {{ content_for_layout }}
//     (drops the Google & YouTube pixel, Shopify analytics, checkout scripts)
//   - hand-coded Google tags (the Google & YouTube app already owns tracking;
//     a second tag double-counts conversions)
//   - 404.html drifting from index.html (GitHub Pages deep-link fallback)
//
//   node tools/audit/static-check.mjs [repo-root]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '../..'));
const rel = f => path.relative(root, f);
const failures = [];
const notes = [];
const fail = (file, msg) => failures.push(`${rel(file)}: ${msg}`);
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];

const themeFiles = walk(path.join(root, 'theme'));
const pages = ['index.html', '404.html'].map(f => path.join(root, f)).filter(fs.existsSync);
const hasLiquid = s => /\{\{|\{%/.test(s);

function checkJs(file, code, where) {
  try { new vm.Script(code, { filename: rel(file) }); }
  catch (e) {
    const m = /:(\d+)/.exec((e.stack || '').split('\n')[0]);
    fail(file, `JS syntax error${where ? ` in ${where}` : ''}${m ? ` (line ${m[1]} of block)` : ''}: ${e.message}`);
  }
}

// ---- inline <script> blocks + JSON-LD (html + liquid) ----
for (const file of [...pages, ...themeFiles.filter(f => f.endsWith('.liquid'))]) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1], body = m[2], line = lineOf(src, m.index);
    if (/\bsrc=/.test(attrs) || !body.trim()) continue;
    const type = (/type=["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || 'text/javascript';
    if (hasLiquid(body)) { notes.push(`${rel(file)}:${line} <script type=${type}> contains Liquid — verified by render-check, not here`); continue; }
    if (type === 'application/ld+json') {
      try { JSON.parse(body); } catch (e) { fail(file, `JSON-LD at line ${line} is invalid JSON: ${e.message}`); }
    } else if (/^(text\/javascript|application\/javascript)$/i.test(type)) {
      checkJs(file, body, `<script> at line ${line}`);
    }
  }
}

// ---- external JS assets ----
for (const file of [...themeFiles.filter(f => f.endsWith('.js')), path.join(root, 'product-images.js')].filter(fs.existsSync)) {
  const src = fs.readFileSync(file, 'utf8');
  if (hasLiquid(src) && file.endsWith('.js.liquid')) continue;
  checkJs(file, src);
}

// ---- Liquid block balance ----
const PAIRS = { if: 'endif', unless: 'endunless', for: 'endfor', case: 'endcase', capture: 'endcapture',
  comment: 'endcomment', raw: 'endraw', form: 'endform', paginate: 'endpaginate', tablerow: 'endtablerow',
  schema: 'endschema', style: 'endstyle', javascript: 'endjavascript', stylesheet: 'endstylesheet' };
const CLOSERS = Object.fromEntries(Object.entries(PAIRS).map(([o, c]) => [c, o]));
for (const file of themeFiles.filter(f => f.endsWith('.liquid'))) {
  const src = fs.readFileSync(file, 'utf8');
  const stack = [];
  const tags = [];
  for (const m of src.matchAll(/\{%-?\s*(\w+)([\s\S]*?)-?%\}/g)) {
    const name = m[1], line = lineOf(src, m.index);
    if (name === 'liquid') {           // {% liquid %} block: one tag per line
      m[2].split('\n').forEach((l, i) => { const w = (/^\s*(\w+)/.exec(l) || [])[1]; if (w) tags.push([w, line + i]); });
    } else tags.push([name, line]);
  }
  let inComment = false, inRaw = false;
  for (const [name, line] of tags) {
    if (inComment && name !== 'endcomment') continue;
    if (inRaw && name !== 'endraw') continue;
    if (PAIRS[name]) { stack.push([name, line]); if (name === 'comment') inComment = true; if (name === 'raw') inRaw = true; }
    else if (CLOSERS[name]) {
      const top = stack.pop();
      if (!top) { fail(file, `{% ${name} %} at line ${line} has no opening {% ${CLOSERS[name]} %}`); break; }
      if (top[0] !== CLOSERS[name]) { fail(file, `{% ${name} %} at line ${line} closes {% ${top[0]} %} opened at line ${top[1]}`); break; }
      if (name === 'endcomment') inComment = false; if (name === 'endraw') inRaw = false;
    }
  }
  if (stack.length && !failures.some(f => f.startsWith(rel(file)))) stack.forEach(([n, l]) => fail(file, `{% ${n} %} opened at line ${l} is never closed`));
}

// ---- layouts must keep Shopify's hooks ----
for (const file of themeFiles.filter(f => /[\\/]layout[\\/][^\\/]+\.liquid$/.test(f))) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/\{\{-?\s*content_for_header\s*-?\}\}/.test(src)) fail(file, 'missing {{ content_for_header }} — drops the Google & YouTube pixel, analytics and checkout scripts');
  if (!/\{\{-?\s*content_for_layout\s*-?\}\}/.test(src)) fail(file, 'missing {{ content_for_layout }} — Shopify will reject the layout');
}

// ---- tracking ownership: no hand-coded Google tags ----
for (const file of [...pages, ...themeFiles.filter(f => /\.(liquid|js|html)$/.test(f))]) {
  const src = fs.readFileSync(file, 'utf8');
  const m = /googletagmanager\.com\/gtag\/js|gtag\(\s*['"]config['"]/.exec(src);
  if (m) fail(file, `hand-coded Google tag at line ${lineOf(src, m.index)} — the Google & YouTube app already tags the store; a second tag double-counts conversions`);
}

// ---- GitHub Pages deep-link fallback must mirror index.html ----
if (pages.length === 2 && !fs.readFileSync(pages[0]).equals(fs.readFileSync(pages[1])))
  failures.push('404.html: differs from index.html — regenerate with `cp index.html 404.html`');

// ---- report ----
if (process.env.AUDIT_VERBOSE) notes.forEach(n => console.log('  · ' + n));
if (failures.length) {
  console.log(`STATIC AUDIT FAILED (${failures.length}):`);
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log(`STATIC AUDIT PASSED (${themeFiles.length + pages.length} files; ${notes.length} Liquid-templated scripts left to render-check)`);
