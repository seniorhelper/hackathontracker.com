// Builds the whole site into dist/.  Usage: node scripts/build.mjs [--offline]
// --offline skips the network and rebuilds from data/cache (useful while editing pages).
import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { geocode } from './cities.mjs';
import { PAGES, COPY, staticPages } from './pages.mjs';
import { esc, money, todayStr, daysUntil, fmtDate, applyFilters, sortEvents, cardHTML, icsFor, DEFAULTS, SORTS } from '../src/shared.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://hackathontracker.com';
const OFFLINE = process.argv.includes('--offline');
const now = new Date();
const today = todayStr(now);

const readJSON = async (p, fallback) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; } };
// BASE lets the site run under a sub-folder (e.g. a github.io preview). Leave empty for the real domain.
const BASE = (process.env.BASE || '').replace(/\/$/, '');
const out = async (rel, content) => {
  const p = join(DIST, rel);
  await mkdir(dirname(p), { recursive: true });
  if (BASE && rel.endsWith('.html')) content = content.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
  await writeFile(p, content);
};

// ---------- 1. Collect ----------
const srcDir = join(ROOT, 'scripts', 'sources');
const cacheDir = join(ROOT, 'data', 'cache');
await mkdir(cacheDir, { recursive: true });
const status = [];
let raw = [];
for (const file of (await readdir(srcDir)).filter((f) => f.endsWith('.mjs')).sort()) {
  let mod;
  try { mod = await import(pathToFileURL(join(srcDir, file)).href); } catch (err) { status.push({ name: file, label: file, ok: false, count: 0, note: 'Could not load: ' + err.message }); continue; }
  if (typeof mod.fetchEvents !== 'function') continue;
  const name = mod.name || file.replace('.mjs', '');
  const entry = { name, label: mod.label || name, homepage: mod.homepage || null, ok: false, count: 0, note: '', fetchedAt: null };
  const cacheFile = join(cacheDir, name + '.json');
  let events = null;
  if (!OFFLINE) {
    try {
      events = await Promise.race([
        mod.fetchEvents(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timed out after 150s')), 150000)),
      ]);
      if (!Array.isArray(events)) throw new Error('adapter did not return a list');
      entry.ok = true; entry.fetchedAt = now.toISOString();
      await writeFile(cacheFile, JSON.stringify({ fetchedAt: entry.fetchedAt, events }));
    } catch (err) { entry.note = String(err.message || err).slice(0, 160); events = null; }
  }
  if (!events) {
    const cached = await readJSON(cacheFile, null);
    if (cached && (now - new Date(cached.fetchedAt)) / 864e5 < 7) {
      events = cached.events; entry.fetchedAt = cached.fetchedAt; entry.ok = true;
      entry.note = (entry.note ? entry.note + ' — ' : '') + 'showing last good copy';
    } else events = [];
  }
  for (const e of events) raw.push({ ...e, source: name, sourceLabel: entry.label });
  entry.count = events.length;
  status.push(entry);
  console.log(`${entry.ok ? 'ok  ' : 'FAIL'} ${name.padEnd(12)} ${String(events.length).padStart(5)}  ${entry.note}`);
}

// ---------- 2. Clean ----------
const isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const num = (n) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null);
const str = (s, max = 140) => (typeof s === 'string' && s.trim() ? s.trim().replace(/\s+/g, ' ').slice(0, max) : null);
const httpUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
const AI_RE = /\b(ai|a\.i\.|artificial intelligence|machine learning|ml|llm|llms|gpt|genai|generative|agent|agents|agentic|gemini|claude|openai|deep learning)\b/i;

let events = [];
for (const e of raw) {
  const title = str(e.title, 120), url = httpUrl(e.url);
  if (!title || !url) continue;
  const start = isDate(e.start) ? e.start : null;
  const end = isDate(e.end) ? e.end : null;
  if (end && end < today) continue;
  if (!end && start && daysUntil(start, now) < -45) continue;
  const themes = Array.isArray(e.themes) ? [...new Set(e.themes.map((t) => str(String(t), 30)?.toLowerCase()).filter(Boolean))].slice(0, 8) : [];
  const city = str(e.city, 60);
  let lat = num(Math.abs(e.lat)) != null ? e.lat : null, lon = num(Math.abs(e.lon)) != null ? e.lon : null;
  if ((lat == null || lon == null) && city) { const g = geocode(city); if (g) [lat, lon] = g; else { lat = null; lon = null; } }
  events.push({
    id: str(e.id, 120) || `${e.source}:${url}`, source: e.source, sourceLabel: e.sourceLabel, title, url,
    organizer: str(e.organizer, 80), start, end,
    mode: ['online', 'in-person', 'hybrid'].includes(e.mode) ? e.mode : null,
    city, region: str(e.region, 60), country: str(e.country, 60), lat, lon,
    prizeUsd: num(e.prizeUsd) || null, prizeText: e.prizeUsd ? null : str(e.prizeText, 60),
    registrants: num(e.registrants) == null ? null : Math.round(e.registrants),
    themes,
    eligibility: ['everyone', 'students', 'high-school'].includes(e.eligibility) ? e.eligibility : 'unknown',
    inviteOnly: e.inviteOnly === true,
    beginner: themes.some((t) => t.includes('beginner')),
    ai: AI_RE.test(title) || themes.some((t) => AI_RE.test(t)),
  });
}

// ---------- 3. Merge duplicates (same title listed on two sites) ----------
const keyOf = (e) => e.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
const richness = (e) => (e.prizeUsd ? 2 : 0) + (e.registrants != null ? 2 : 0) + (e.end ? 1 : 0) + (e.city ? 1 : 0);
const byKey = new Map();
for (const e of events) {
  const k = keyOf(e);
  const prev = byKey.get(k);
  if (!prev) { byKey.set(k, e); continue; }
  if (prev.source === e.source) { if (richness(e) > richness(prev)) byKey.set(k, e); continue; }
  const [keep, other] = richness(e) > richness(prev) ? [e, prev] : [prev, e];
  for (const f of ['organizer', 'start', 'end', 'mode', 'city', 'region', 'country', 'lat', 'lon', 'prizeUsd', 'prizeText', 'registrants']) if (keep[f] == null) keep[f] = other[f];
  if (keep.eligibility === 'unknown') keep.eligibility = other.eligibility;
  keep.themes = [...new Set([...keep.themes, ...other.themes])].slice(0, 8);
  keep.alsoOn = [...(keep.alsoOn || []), ...(other.alsoOn || []), { label: other.sourceLabel, url: other.url }];
  byKey.set(k, keep);
}
const merged = events.length - byKey.size;
events = [...byKey.values()];

// ---------- 4. Odds ----------
// Prize per entrant = total cash prize / people signed up. Needs both numbers and at least 10 sign-ups.
for (const e of events) {
  e.perReg = null; e.oddsTier = null; e.early = false;
  if (e.prizeUsd && e.registrants != null) {
    if (e.registrants >= 10) e.perReg = Math.round((e.prizeUsd / e.registrants) * 100) / 100;
    else e.early = true;
  }
}
const scored = events.filter((e) => e.perReg != null).sort((a, b) => b.perReg - a.perReg);
scored.forEach((e, i) => { e.oddsTier = i < scored.length / 3 ? 'strong' : i < (scored.length * 2) / 3 ? 'fair' : 'crowded'; });
const cut = { strong: scored[Math.ceil(scored.length / 3) - 1]?.perReg ?? null, fair: scored[Math.ceil((scored.length * 2) / 3) - 1]?.perReg ?? null };

// ---------- 5. First-seen tracking (drives "New" badges and the new-listings feed) ----------
const seenFile = join(ROOT, 'data', 'seen.json');
const seen = await readJSON(seenFile, { bootstrap: today, ids: {} });
const live = {};
for (const e of events) {
  e.firstSeen = seen.ids[e.id] || today;
  live[e.id] = e.firstSeen;
  e.isNew = e.firstSeen > seen.bootstrap && daysUntil(e.firstSeen, now) >= -7;
}
if (events.length) await writeFile(seenFile, JSON.stringify({ bootstrap: seen.bootstrap, ids: live }));

// ---------- 6. Stats ----------
const stats = {
  updated: now.toISOString(), total: events.length, merged,
  prizeTotal: events.reduce((s, e) => s + (e.prizeUsd || 0), 0),
  withOdds: scored.length, online: events.filter((e) => e.mode === 'online').length,
  inPerson: events.filter((e) => e.mode === 'in-person' || e.mode === 'hybrid').length,
  sources: status.filter((s) => s.ok && s.count).length, cut,
};
const updatedText = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver', timeZoneName: 'short' });

// ---------- 7. Templates ----------
const NAV = [['/', 'Search'], ['/best-odds/', 'Best odds'], ['/online-hackathons/', 'Online'], ['/ai-hackathons/', 'AI'], ['/open-to-everyone/', 'No student ID'], ['/blog/', 'Blog']];

function layout({ path, title, description, body, jsonld, noindex }) {
  const canonical = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'">
<meta name="theme-color" content="#0c0f14">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="New hackathons" href="/feeds/new.xml">
<link rel="stylesheet" href="/assets/styles.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap bar">
  <a class="logo" href="/" aria-label="${esc(COPY.name)} home"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect width="32" height="32" rx="4" fill="var(--brand)"/><path d="M9 10l7 6-7 6M18 22h6" fill="none" stroke="var(--on-brand)" stroke-width="3" stroke-linecap="square"/></svg><span>hackathon_tracker</span></a>
  <nav aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
</div></header>
<main id="main">${body}</main>
<footer class="site"><div class="wrap">
  <p><a href="/methodology/">How the odds work</a> · <a href="/sources/">Sources</a> · <a href="/alerts/">Alerts &amp; calendar</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a></p>
  <p class="small">Data last refreshed ${esc(updatedText)}. ${esc(COPY.name)} is independent and not affiliated with the organizers or platforms listed. Always check the official rules before you enter.</p>
</div></footer>
</body></html>`;
}

const opt = (v, label, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${label}</option>`;
const chk = (name, label, cur) => `<label class="chk"><input type="checkbox" name="${name}"${cur ? ' checked' : ''}> ${label}</label>`;

function finder(preset = {}) {
  const f = { ...DEFAULTS, ...preset };
  const list = sortEvents(applyFilters(events, f, now), f.sort, now);
  const prize = list.reduce((s, e) => s + (e.prizeUsd || 0), 0);
  return `<section id="finder" class="finder" data-updated="${stats.updated}">
<script type="application/json" id="preset">${JSON.stringify(preset).replace(/</g, '\\u003c')}</script>
<form id="filters" class="filters" role="search" aria-label="Filter hackathons">
  <div class="row main">
    <label class="grow"><span>Search</span><input type="search" name="q" placeholder="AI, fintech, a sponsor, a school…" value="${esc(f.q)}" autocomplete="off"></label>
    <label><span>City or country</span><input type="text" name="place" placeholder="Denver, India, …" value="${esc(f.place)}" autocomplete="off"></label>
    <label><span>Sort by</span><select name="sort">${Object.entries(SORTS).map(([v, l]) => opt(v, l, f.sort)).join('')}</select></label>
  </div>
  <div class="row">
    <label><span>Where</span><select name="mode">${opt('any', 'Online or in person', f.mode)}${opt('online', 'Online', f.mode)}${opt('in-person', 'In person', f.mode)}</select></label>
    <label><span>Prize money</span><select name="minPrize">${opt(0, 'Any', f.minPrize)}${opt(1000, '$1,000+', f.minPrize)}${opt(10000, '$10,000+', f.minPrize)}${opt(50000, '$50,000+', f.minPrize)}</select></label>
    <label><span>Deadline</span><select name="within">${opt(0, 'Any time', f.within)}${opt(3, 'Next 3 days', f.within)}${opt(7, 'Next 7 days', f.within)}${opt(30, 'Next 30 days', f.within)}</select></label>
    <label><span>Odds</span><select name="odds">${opt('any', 'Any', f.odds)}${opt('fair', 'Fair or better', f.odds)}${opt('strong', 'Strong only', f.odds)}</select></label>
    <label><span>Listed on</span><select name="source">${opt('any', 'All sources', f.source)}${status.filter((s) => s.count).map((s) => opt(s.name, esc(s.label), f.source)).join('')}</select></label>
  </div>
  <div class="row checks">
    ${chk('hideStudent', 'Hide student-only', f.hideStudent)}${chk('beginner', 'Beginner friendly', f.beginner)}${chk('ai', 'AI', f.ai)}${chk('saved', 'My saved list', f.saved)}
    <span class="near"><button type="button" id="nearBtn" class="btn ghost">Near me</button>
      <select name="km" aria-label="Distance">${opt(80, '50 mi', f.km)}${opt(160, '100 mi', f.km)}${opt(400, '250 mi', f.km)}</select></span>
    <button type="reset" class="btn ghost" id="resetBtn">Clear filters</button>
  </div>
  <p id="nearMsg" class="small" role="status" hidden></p>
</form>
<p id="count" class="count" role="status" aria-live="polite"><b>${list.length.toLocaleString('en-US')}</b> hackathons${prize ? ` · <b>${money(prize)}</b> in listed prizes` : ''}</p>
<div id="results" class="results">${list.slice(0, 24).map((e) => cardHTML(e, now)).join('\n') || '<p class="empty">Nothing matches right now. This list refreshes daily.</p>'}</div>
<p class="more"><button type="button" id="moreBtn" class="btn"${list.length > 24 ? '' : ' hidden'}>Show more</button></p>
<noscript><p class="small">Filters need JavaScript. The list above still shows the current top results.</p></noscript>
</section>
<script type="module" src="/assets/app.js"></script>`;
}

const prose = (html) => `<div class="wrap prose">${html}</div>`;
const ctx = { stats, status, events, scored, money, esc, fmtDate, updatedText, cut, SITE, today };

// ---------- 8. Write site ----------
await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, 'assets'), { recursive: true });
for (const f of ['shared.js', 'app.js', 'styles.css', 'icon.svg']) await cp(join(ROOT, 'src', f), join(DIST, 'assets', f));
const slim = events.map(({ lat, lon, ...e }) => ({ ...e, lat: lat == null ? null : Math.round(lat * 100) / 100, lon: lon == null ? null : Math.round(lon * 100) / 100 }));
await out('data/events.json', JSON.stringify({ updated: stats.updated, events: slim }));
await out('data/stats.json', JSON.stringify({ ...stats, sources: status }));

const sitemap = [];
const page = async (p) => { await out((p.path === '/' ? '' : p.path.slice(1)) + (p.file || 'index.html'), layout(p)); if (!p.noindex) sitemap.push(p.path); };

// Home
await page({
  path: '/', title: COPY.homeTitle, description: COPY.homeDesc,
  jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: COPY.name, url: SITE + '/', potentialAction: { '@type': 'SearchAction', target: SITE + '/?q={search_term_string}', 'query-input': 'required name=search_term_string' } },
  body: `<section class="hero"><div class="wrap">
  <h1>${COPY.h1}</h1>
  <p class="lede">${COPY.lede}</p>
  <ul class="stats"><li><b>${stats.total.toLocaleString('en-US')}</b> open or upcoming</li><li><b>${money(stats.prizeTotal)}</b> in listed prizes</li><li><b>${stats.withOdds}</b> with odds scored</li><li><b>${stats.sources}</b> sources checked</li></ul>
</div></section>
<div class="wrap">${finder({})}</div>
${prose(COPY.homeBelow(ctx))}`,
});

// Landing pages
for (const p of PAGES) {
  const list = applyFilters(events, { ...DEFAULTS, ...p.preset }, now);
  await page({
    path: `/${p.slug}/`, title: p.title, description: p.description,
    body: `<section class="hero small"><div class="wrap"><h1>${p.h1}</h1><p class="lede">${p.intro}</p>
<p class="small">${list.length.toLocaleString('en-US')} match today · refreshed ${esc(updatedText)}</p></div></section>
<div class="wrap">${finder(p.preset)}</div>${prose(p.below)}`,
  });
}

// Static pages (methodology, sources, alerts, about, privacy)
for (const p of staticPages(ctx)) await page({ ...p, body: `<section class="hero small"><div class="wrap"><h1>${p.h1}</h1></div></section>${prose(p.html)}` });

// Blog
const blogDir = join(ROOT, 'content', 'blog');
const posts = [];
if (existsSync(blogDir)) {
  for (const f of (await readdir(blogDir)).filter((x) => x.endsWith('.html'))) {
    const txt = await readFile(join(blogDir, f), 'utf8');
    const m = txt.match(/^\s*<!--meta\s+(\{[\s\S]*?\})\s*-->/);
    if (!m) { console.warn('blog: no meta in', f); continue; }
    let meta; try { meta = JSON.parse(m[1]); } catch { console.warn('blog: bad meta in', f); continue; }
    posts.push({ slug: f.replace('.html', ''), ...meta, html: txt.slice(m[0].length) });
  }
}
posts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug));
for (const p of posts) {
  await page({
    path: `/blog/${p.slug}/`, title: `${p.title} | ${COPY.name}`, description: p.description,
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated || p.date, mainEntityOfPage: `${SITE}/blog/${p.slug}/`, publisher: { '@type': 'Organization', name: COPY.name } },
    body: `<section class="hero small"><div class="wrap"><p class="small"><a href="/blog/">Blog</a> · ${esc(fmtDate(p.date))}</p><h1>${esc(p.title)}</h1></div></section>
${prose(p.html + `<p class="cta"><a class="btn" href="/">Search ${stats.total.toLocaleString('en-US')} live hackathons</a></p>`)}`,
  });
}
await page({
  path: '/blog/', title: `Hackathon Guides | ${COPY.name}`, description: 'Practical guides on choosing, entering and winning hackathons, for adults and students alike.',
  body: `<section class="hero small"><div class="wrap"><h1>Hackathon guides</h1></div></section>
<div class="wrap prose">${posts.length ? `<ul class="postlist">${posts.map((p) => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a><p>${esc(p.description)}</p></li>`).join('')}</ul>` : '<p>Guides are on the way.</p>'}</div>`,
});

// 404
await out('404.html', layout({ path: '/404.html', title: `Page not found | ${COPY.name}`, description: 'Page not found.', noindex: true, body: prose('<h1>That page isn’t here</h1><p><a class="btn" href="/">Back to the hackathon search</a></p>') }));

// Feeds
const rssItem = (e) => `<item><title>${esc(e.title)}</title><link>${esc(e.url)}</link><guid isPermaLink="false">${esc(e.id)}</guid><pubDate>${new Date(e.firstSeen + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc([e.prizeUsd ? money(e.prizeUsd) + ' in prizes' : null, e.registrants != null ? e.registrants.toLocaleString('en-US') + ' signed up' : null, e.perReg != null ? money(e.perReg) + ' per entrant' : null, e.mode === 'online' ? 'Online' : [e.city, e.country].filter(Boolean).join(', ') || null, e.end ? 'Closes ' + fmtDate(e.end) : null].filter(Boolean).join(' · '))}</description></item>`;
const rss = (title, path, list) => `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(title)}</title><link>${SITE}/</link><description>${esc(title)} from ${esc(COPY.name)}</description><lastBuildDate>${now.toUTCString()}</lastBuildDate>${list.map(rssItem).join('')}</channel></rss>`;
await out('feeds/new.xml', rss('Newly listed hackathons', '/feeds/new.xml', sortEvents(events, 'new', now).slice(0, 60)));
await out('feeds/best-odds.xml', rss('Hackathons with the best odds', '/feeds/best-odds.xml', scored.filter((e) => e.oddsTier === 'strong').slice(0, 60)));
await out('feeds/deadlines.ics', icsFor(sortEvents(events.filter((e) => e.end && e.prizeUsd), 'soon', now).slice(0, 300), 'Hackathon deadlines (prize events)'));

// Housekeeping files
await out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('')}</urlset>`);
await out('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
if (!BASE) await out('CNAME','hackathontracker.com\n');
await out('.nojekyll', '');

console.log(`\nBuilt ${sitemap.length} pages · ${events.length} events (${merged} duplicates merged) · ${scored.length} with odds · ${posts.length} blog posts`);
if (!events.length) { console.error('No events — refusing to call this build good.'); process.exit(1); }
