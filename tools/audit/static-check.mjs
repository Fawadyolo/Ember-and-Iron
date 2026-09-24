// Static audit: offline, ~1s. Catches the mistakes that have actually shipped
// (or nearly shipped) on this project, before anything is handed over:
//   - JS syntax errors (one stray comma blanks the whole store)
//   - broken JSON-LD / theme JSON (Google silently drops it; Shopify rejects it)
//   - unbalanced Liquid blocks (Shopify refuses the save, or renders garbage)
//   - a layout render path missing {{ content_for_header }} / {{ content_for_layout }}
//     (drops the Google & YouTube pixel, Search Console verification, checkout scripts)
//   - hand-coded Google / Meta tags (the Shopify apps already own tracking;
//     a second tag double-counts conversions)
//   - 404.html drifting from index.html (GitHub Pages deep-link fallback)
//
//   node tools/audit/static-check.mjs [repo-root]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || fileURLToPath(new URL('../..', import.meta.url)));
const rel = f => path.relative(root, f);
const failures = [];
const notes = [];
const fail = (file, msg) => failures.push(`${rel(file)}: ${msg}`);
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];

// Refuse to "pass" an audit that looked at nothing (wrong root, bad checkout).
if (!fs.existsSync(path.join(root, 'theme', 'layout', 'theme.liquid'))) {
  console.log(`STATIC AUDIT FAILED: ${root} has no theme/layout/theme.liquid — wrong root or incomplete checkout`);
  process.exit(1);
}

const themeFiles = walk(path.join(root, 'theme'));
const pages = ['index.html', '404.html'].map(f => path.join(root, f)).filter(fs.existsSync);
const hasLiquid = s => /\{\{|\{%/.test(s);
// Comments are blanked (same length, newlines kept) so line numbers stay right
// and commented-out code can't satisfy — or trip — the checks below.
const blank = s => s.replace(/[^\n]/g, ' ');
const stripComments = src => src
  .replace(/\{%-?\s*(comment|doc)\s*-?%\}[\s\S]*?\{%-?\s*end\1\s*-?%\}/g, blank)
  .replace(/\{%-?\s*#[\s\S]*?-?%\}/g, blank)
  .replace(/<!--[\s\S]*?-->/g, blank);

function checkJs(file, code, where, isModule) {
  if (isModule) {
    const tmp = path.join(os.tmpdir(), `ember-audit-${process.pid}.mjs`);
    fs.writeFileSync(tmp, code);
    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    fs.rmSync(tmp, { force: true });
    if (r.status !== 0) fail(file, `JS syntax error${where ? ` in ${where}` : ''}: ${(r.stderr.match(/SyntaxError.*$/m) || [r.stderr.trim()])[0]}`);
    return;
  }
  try { new vm.Script(code, { filename: rel(file) }); }
  catch (e) {
    const m = /:(\d+)/.exec((e.stack || '').split('\n')[0]);
    fail(file, `JS syntax error${where ? ` in ${where}` : ''}${m ? ` (line ${m[1]} of block)` : ''}: ${e.message}`);
  }
}

// ---- inline <script> blocks + JSON-LD (html + liquid) ----
for (const file of [...pages, ...themeFiles.filter(f => f.endsWith('.liquid'))]) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1], body = m[2], line = lineOf(src, m.index);
    if (/\bsrc=/.test(attrs) || !body.trim()) continue;
    const type = (/type=["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || 'text/javascript';
    if (hasLiquid(body)) { notes.push(`${rel(file)}:${line} <script type=${type}> is Liquid-templated — only checkable rendered (render-check on a page using this template)`); continue; }
    if (type === 'application/ld+json') {
      try { JSON.parse(body); } catch (e) { fail(file, `JSON-LD at line ${line} is invalid JSON: ${e.message}`); }
    } else if (/^(text\/javascript|application\/javascript|module)$/i.test(type)) {
      checkJs(file, body, `<script> at line ${line}`, type === 'module');
    }
  }
}

// ---- external JS assets ----
for (const file of [...themeFiles.filter(f => f.endsWith('.js')), path.join(root, 'product-images.js')].filter(fs.existsSync))
  checkJs(file, fs.readFileSync(file, 'utf8'));

// ---- theme JSON (config, locales, JSON templates) ----
for (const file of themeFiles.filter(f => f.endsWith('.json'))) {
  const src = fs.readFileSync(file, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''); // Shopify's auto-generated header
  try { JSON.parse(src); } catch (e) { fail(file, `invalid JSON: ${e.message}`); }
}

// ---- Liquid block balance ----
const PAIRS = { if: 'endif', unless: 'endunless', for: 'endfor', case: 'endcase', capture: 'endcapture',
  comment: 'endcomment', doc: 'enddoc', raw: 'endraw', form: 'endform', paginate: 'endpaginate',
  tablerow: 'endtablerow', schema: 'endschema', style: 'endstyle', javascript: 'endjavascript', stylesheet: 'endstylesheet' };
const CLOSERS = Object.fromEntries(Object.entries(PAIRS).map(([o, c]) => [c, o]));
const OPAQUE = new Set(['comment', 'doc', 'raw']);           // contents are not Liquid
const BRANCHES = { else: ['if', 'unless', 'for', 'case'], elsif: ['if', 'unless'], when: ['case'] };
for (const file of themeFiles.filter(f => f.endsWith('.liquid'))) {
  const src = fs.readFileSync(file, 'utf8');
  const tags = [];
  for (const m of src.matchAll(/\{%-?\s*(\w+)([\s\S]*?)-?%\}/g)) {
    const name = m[1], line = lineOf(src, m.index);
    if (name === 'liquid') {           // {% liquid %} block: one tag per line
      m[2].split('\n').forEach((l, i) => { const w = (/^\s*(\w+)/.exec(l) || [])[1]; if (w) tags.push([w, line + i]); });
    } else tags.push([name, line]);
  }
  const stack = [];
  let opaque = null, broken = false;
  for (const [name, line] of tags) {
    if (opaque) { if (name === PAIRS[opaque]) { opaque = null; stack.pop(); } continue; }
    if (PAIRS[name]) { stack.push([name, line]); if (OPAQUE.has(name)) opaque = name; }
    else if (CLOSERS[name]) {
      const top = stack.pop();
      if (!top) { fail(file, `{% ${name} %} at line ${line} has no opening {% ${CLOSERS[name]} %}`); broken = true; break; }
      if (top[0] !== CLOSERS[name]) { fail(file, `{% ${name} %} at line ${line} closes {% ${top[0]} %} opened at line ${top[1]}`); broken = true; break; }
    } else if (BRANCHES[name]) {
      const top = stack[stack.length - 1];
      if (!top || !BRANCHES[name].includes(top[0])) { fail(file, `{% ${name} %} at line ${line} is outside any ${BRANCHES[name].join('/')} block`); broken = true; break; }
    }
  }
  if (!broken) stack.forEach(([n, l]) => fail(file, `{% ${n} %} opened at line ${l} is never closed`));
}

// ---- layouts must keep Shopify's hooks in EVERY render path ----
// A layout can emit several complete documents from if/else branches (e.g. the
// server-rendered policy pages); each <html> needs its own pair of hooks.
for (const file of themeFiles.filter(f => /[\\/]layout[\\/][^\\/]+\.liquid$/.test(f))) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  const docs = Math.max(1, (src.match(/<html[\s>]/gi) || []).length);
  const header = (src.match(/\{\{-?\s*content_for_header\s*-?\}\}/g) || []).length;
  const layout = (src.match(/\{\{-?\s*content_for_layout\s*-?\}\}/g) || []).length;
  if (header < docs) fail(file, `${docs} <html> document(s) but ${header} {{ content_for_header }} — a render path loses the Google & YouTube pixel, Search Console verification and checkout scripts`);
  if (layout < docs) fail(file, `${docs} <html> document(s) but ${layout} {{ content_for_layout }} — a render path drops the page content`);
}

// ---- tracking ownership: no hand-coded Google / Meta tags ----
const TRACKING = [
  [/googletagmanager\.com\/(gtag\/js|gtm\.js)/, 'Google tag script'],
  [/gtag\(\s*['"`](config|event)['"`]/, 'gtag() call'],
  [/\bAW-\d{6,}/, 'Google Ads ID'],
  [/fbq\(\s*['"`]init['"`]/, 'Meta pixel init'],
];
for (const file of [...pages, ...themeFiles.filter(f => /\.(liquid|js|html)$/.test(f))]) {
  const src = /\.(liquid|html)$/.test(file) ? stripComments(fs.readFileSync(file, 'utf8')) : fs.readFileSync(file, 'utf8');
  for (const [re, what] of TRACKING) {
    const m = re.exec(src);
    if (m) { fail(file, `hand-coded ${what} at line ${lineOf(src, m.index)} ("${m[0]}") — tracking is owned by the Shopify Google & YouTube / Meta apps; a second tag double-counts conversions`); break; }
  }
}

// ---- owner-briefed business facts (tools/audit/brand-facts.json) ----
// Everything Shopify serves (theme/) must agree with what the owner has
// confirmed: one email, one address, no warranty / installation / servicing,
// current delivery terms. index.html is the legacy GitHub Pages build and is
// not served by the store, so it is not held to these rules.
const factsFile = path.join(root, 'tools', 'audit', 'brand-facts.json');
if (fs.existsSync(factsFile)) {
  const { forbidden } = JSON.parse(fs.readFileSync(factsFile, 'utf8'));
  for (const file of themeFiles.filter(f => /\.(liquid|js|json|css)$/.test(f))) {
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    for (const rule of forbidden) {
      const m = new RegExp(rule.pattern, rule.flags).exec(src);
      if (m) fail(file, `contradicts the owner's brief at line ${lineOf(src, m.index)} ("${m[0]}") — ${rule.why}`);
    }
  }
} else {
  failures.push('tools/audit/brand-facts.json: missing — the owner-briefed facts cannot be checked');
}

// ---- visible FAQ and FAQPage JSON-LD must say exactly the same thing ----
{
  const file = path.join(root, 'theme', 'layout', 'theme.liquid');
  const s = fs.readFileSync(file, 'utf8');
  const decode = t => t.replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/&larr;|&rarr;/g, '').replace(/\s+/g, ' ').trim();
  const slides = [...s.matchAll(/<h3 class="faq-slide-q">([\s\S]*?)<\/h3>\s*<p class="faq-slide-a">([\s\S]*?)<\/p>/g)].map(m => [decode(m[1]), decode(m[2])]);
  const at = s.indexOf('"@type": "FAQPage"');
  if (slides.length && at >= 0) {
    const k = s.indexOf('"mainEntity": [', at) + '"mainEntity": ['.length;
    let d = 1, e = k; while (d && e < s.length) { d += (s[e] === '[') - (s[e] === ']'); e++; }
    let ld = [];
    try { ld = JSON.parse('[' + s.slice(k, e - 1) + ']').map(q => [q.name, q.acceptedAnswer.text].map(t => t.replace(/\s+/g, ' ').trim())); }
    catch (err) { fail(file, `FAQPage JSON-LD is not valid JSON: ${err.message}`); }
    if (ld.length && JSON.stringify(ld) !== JSON.stringify(slides))
      fail(file, `FAQPage JSON-LD (${ld.length} Q&As) does not match the visible #faq section (${slides.length}) word for word — regenerate one from the other`);
  } else if (slides.length || at >= 0) {
    fail(file, 'visible FAQ and FAQPage JSON-LD must both exist, or neither');
  }
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
console.log(`STATIC AUDIT PASSED (${themeFiles.length + pages.length} files; ${notes.length} Liquid-templated scripts need render-check)`);
