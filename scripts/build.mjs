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
// "Last refreshed" = when the listings were actually fetched (an --offline rebuild must not claim fresh data).
const fetchedTimes = status.map((s) => s.fetchedAt).filter(Boolean).sort();
const dataTime = fetchedTimes.length ? new Date(fetchedTimes[fetchedTimes.length - 1]) : now;
const stats = {
  updated: dataTime.toISOString(), total: events.length, merged,
  prizeTotal: events.reduce((s, e) => s + (e.prizeUsd || 0), 0),
  withOdds: scored.length, online: events.filter((e) => e.mode === 'online').length,
  inPerson: events.filter((e) => e.mode === 'in-person' || e.mode === 'hybrid').length,
  sources: status.filter((s) => s.ok && s.count).length, cut,
};
const updatedText = dataTime.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver', timeZoneName: 'short' });

// ---------- 7. Templates ----------
const NAV = [['/', 'Search'], ['/top-50/', 'Top 50'], ['/submissions/', 'Entry wall'], ['/best-odds/', 'Best odds'], ['/online-hackathons/', 'Online'], ['/ai-hackathons/', 'AI'], ['/open-to-everyone/', 'No student ID'], ['/blog/', 'Blog']];

function layout({ path, title, description, body, jsonld, noindex }) {
  const canonical = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self' https://formsubmit.co">
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
  <p><a href="/top-50/">Top 50</a> · <a href="/submissions/">Entry wall</a> · <a href="/submit/">Submit your project</a> · <a href="/methodology/">How the odds work</a> · <a href="/sources/">Sources</a> · <a href="/alerts/">Alerts &amp; calendar</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a></p>
  <p class="small">Data last refreshed ${esc(updatedText)}. ${esc(COPY.name)} is independent and not affiliated with the organizers or platforms listed. Always check the official rules before you enter.</p>
</div></footer>
<p class="heart"><span class="beat" aria-hidden="true">❤</span><a href="https://eyetoad.com/" rel="noopener" target="_blank">Need a website?</a></p>
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
for (const f of ['shared.js', 'app.js', 'watch.js', 'wall.js', 'styles.css', 'icon.svg']) await cp(join(ROOT, 'src', f), join(DIST, 'assets', f));
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

// ---------- Entry wall data (content/submissions.json, approved entries only) ----------
const normUrl = (u) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '')).toLowerCase(); } catch { return ''; } };
const evByUrl = new Map(events.map((e) => [normUrl(e.url), e]));
const evByKey = new Map(events.map((e) => [keyOf(e), e]));
const subRaw = await readJSON(join(ROOT, 'content', 'submissions.json'), { entries: [] });
const entries = [];
for (const s of subRaw.entries || []) {
  const project = str(s.project, 80), siteUrl = httpUrl(s.siteUrl), hackathon = str(s.hackathon, 120);
  if (!project || !siteUrl || !hackathon) { console.warn('wall: skipped an entry missing project, siteUrl or hackathon'); continue; }
  const match = (s.hackathonUrl && evByUrl.get(normUrl(s.hackathonUrl))) || evByKey.get(hackathon.toLowerCase().replace(/[^a-z0-9]+/g, ''));
  entries.push({
    id: str(s.id, 60) || project.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    project, builder: str(s.builder, 80), hackathon, hackathonUrl: httpUrl(s.hackathonUrl) || match?.url || null,
    hkKey: match ? match.id : 'h:' + hackathon.toLowerCase().replace(/[^a-z0-9]+/g, ''),
    pitch: str(s.pitch, 200), siteUrl, devpostUrl: httpUrl(s.devpostUrl), codeUrl: httpUrl(s.codeUrl), videoUrl: httpUrl(s.videoUrl),
    tags: Array.isArray(s.tags) ? s.tags.map((t) => str(String(t), 24)).filter(Boolean).slice(0, 5) : [],
    added: isDate(s.added) ? s.added : null, featured: s.featured === true, note: str(s.note, 40),
  });
}
entries.sort((a, b) => (b.featured - a.featured) || (b.added || '').localeCompare(a.added || ''));
const entryCount = new Map();
for (const s of entries) entryCount.set(s.hkKey, (entryCount.get(s.hkKey) || 0) + 1);

// ---------- Top 50 watch page ----------
const top50 = events.filter((e) => e.prizeUsd).sort((a, b) => b.prizeUsd - a.prizeUsd || cmpPer(a, b)).slice(0, 50);
function cmpPer(a, b) { return (b.perReg ?? -1) - (a.perReg ?? -1); }
const top50Prize = top50.reduce((s, e) => s + e.prizeUsd, 0);
const top50Week = top50.filter((e) => { const d = daysUntil(e.end, now); return d != null && d >= 0 && d <= 7; }).length;
const ODDS = { strong: 'Strong odds', fair: 'Fair odds', crowded: 'Crowded' };
const watchRow = (e, i) => {
  const where = e.mode === 'online' ? 'Online' : [e.city, e.country].filter(Boolean).join(', ') || (e.mode === 'in-person' ? 'In person' : '');
  const n = entryCount.get(e.id) || 0;
  return `<li class="w-row" data-end="${e.end || ''}" data-prize="${e.prizeUsd}" data-per="${e.perReg ?? ''}" data-reg="${e.registrants ?? ''}">
  <span class="w-rank">${i + 1}</span>
  <div class="w-main">
    <h3><a href="${esc(e.url)}" rel="noopener" target="_blank">${esc(e.title)}</a></h3>
    <p class="meta">${[e.organizer, where, 'Listed on ' + e.sourceLabel].filter(Boolean).map(esc).join(' · ')}</p>
    <p class="badges">${e.oddsTier ? `<span class="badge odds-${e.oddsTier}">${ODDS[e.oddsTier]}</span>` : ''}${e.ai ? '<span class="badge plain">AI</span>' : ''}${e.eligibility === 'students' ? '<span class="badge elig">Students only</span>' : ''}${e.isNew ? '<span class="badge new">New</span>' : ''}</p>
  </div>
  <div class="w-nums">
    <div class="fact"><b>${money(e.prizeUsd)}</b><span>in prizes</span></div>
    <div class="fact"><b>${e.registrants != null ? e.registrants.toLocaleString('en-US') : '—'}</b><span>signed up</span></div>
    <div class="fact"><b>${e.perReg != null ? money(e.perReg) : '—'}</b><span>per entrant</span></div>
  </div>
  <div class="w-clock"><b class="left" data-end="${e.end || ''}">${esc(e.end ? deadlineShort(e.end) : 'Dates TBA')}</b>
    <a class="small" href="/submissions/?h=${encodeURIComponent(e.id)}">${n ? `See ${n} entr${n === 1 ? 'y' : 'ies'} →` : 'Post your entry →'}</a></div>
</li>`;
};
function deadlineShort(end) { const d = daysUntil(end, now); return d == null ? 'Dates TBA' : d < 0 ? 'Closed' : d === 0 ? 'Closes today' : d === 1 ? '1 day left' : `${d} days left`; }

await page({
  path: '/top-50/', title: 'Top 50 Hackathons by Prize Money, Live | Hackathon Tracker',
  description: `The 50 biggest open hackathon prize pools in one live watchlist: ${money(top50Prize)} in prizes, sign-up counts, odds and days left for each.`,
  jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Top 50 open hackathons by prize money', numberOfItems: top50.length, itemListElement: top50.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.title, url: e.url })) },
  body: `<section class="hero small"><div class="wrap">
  <h1>Top 50 hackathons.<br>One watchlist.</h1>
  <p class="lede">The biggest open prize pools, ranked and counting down.</p>
  <p class="ctas"><a class="btn" href="/submit/">Post your entry</a><a class="btn ghost" href="/">Search all ${stats.total.toLocaleString('en-US')}</a></p>
  <ul class="stats"><li><b>${money(top50Prize)}</b> in prizes</li><li><b>${top50Week}</b> closing this week</li><li><b>${entries.length}</b> on the entry wall</li></ul>
</div></section>
<div class="wrap" id="watch">
  <div class="w-sort" role="group" aria-label="Sort the top 50">
    <button type="button" class="btn ghost" data-sort="prize" aria-pressed="true">Biggest prize</button>
    <button type="button" class="btn ghost" data-sort="soon" aria-pressed="false">Closing soonest</button>
    <button type="button" class="btn ghost" data-sort="per" aria-pressed="false">Best odds</button>
    <button type="button" class="btn ghost" data-sort="quiet" aria-pressed="false">Fewest entrants</button>
  </div>
  <ol class="watch" id="watchList">${top50.map(watchRow).join('\n')}</ol>
  <p class="small">Ranked by listed US-dollar prize pool. Days left use the listed date only; the official page has the exact closing time. Refreshed ${esc(updatedText)}.</p>
</div>
${prose(`<h2>How the top 50 are picked</h2>
<p>We take every open or upcoming hackathon we track that lists a cash prize in US dollars and rank them by total prize pool. Use the buttons to re-sort the same 50 by deadline, by <a href="/methodology/">prize per entrant</a>, or by how few people have signed up.</p>
<p>A big pot usually means a big crowd, so check the per-entrant number before you commit. Want the full list with filters? <a href="/">Search every hackathon</a>.</p>
<h2>Entered one of these?</h2>
<p>Put your build on the <a href="/submissions/">entry wall</a> so judges, sponsors and other builders can find it. It's free and takes two minutes.</p>`)}
<script type="module" src="/assets/watch.js"></script>`,
});

// ---------- Entry wall ----------
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 6, 7);
const wallCard = (s) => {
  const links = [['Live site', s.siteUrl], ['Devpost', s.devpostUrl], ['Code', s.codeUrl], ['Video', s.videoUrl]].filter(([, u]) => u)
    .map(([t, u], i) => `<a class="${i ? 'btn ghost' : 'btn'}" href="${esc(u)}" rel="noopener nofollow ugc" target="_blank">${t}</a>`).join('');
  return `<article class="card entry${s.featured ? ' featured' : ''}" data-h="${esc(s.hkKey)}" data-text="${esc([s.project, s.builder, s.hackathon, s.pitch, s.tags.join(' ')].join(' ').toLowerCase())}">
  <div class="e-top"><span class="mono c${hue(s.project)}" aria-hidden="true">${esc(s.project[0].toUpperCase())}</span>
    <div><h3>${esc(s.project)}</h3><p class="meta">${s.builder ? 'by ' + esc(s.builder) + ' · ' : ''}${s.added ? 'Added ' + esc(fmtDate(s.added)) : ''}</p></div></div>
  <p class="badges">${s.note ? `<span class="badge new">${esc(s.note)}</span>` : ''}<span class="badge plain">${s.hackathonUrl ? `<a href="${esc(s.hackathonUrl)}" rel="noopener" target="_blank">${esc(s.hackathon)}</a>` : esc(s.hackathon)}</span></p>
  ${s.pitch ? `<p class="pitch">${esc(s.pitch)}</p>` : ''}
  ${s.tags.length ? `<p class="foot">${s.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
  <p class="e-links">${links}</p>
</article>`;
};
const wallHks = [...new Map(entries.map((s) => [s.hkKey, s.hackathon])).entries()];
await page({
  path: '/submissions/', title: 'Hackathon Entry Wall: Projects Builders Submitted | Hackathon Tracker',
  description: 'A public wall of hackathon projects, posted by the people who built them. Browse entries by hackathon, or add your own build for free.',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Hackathon entry wall', url: SITE + '/submissions/', mainEntity: { '@type': 'ItemList', numberOfItems: entries.length, itemListElement: entries.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'CreativeWork', name: s.project, url: s.siteUrl, ...(s.builder ? { creator: { '@type': 'Person', name: s.builder } } : {}) } })) } },
  body: `<section class="hero small"><div class="wrap">
  <h1>The hackathon entry wall.</h1>
  <p class="lede">Built something? Stack it here where judges, sponsors and builders can see it.</p>
  <p class="ctas"><a class="btn" href="/submit/">Post your project</a><a class="btn ghost" href="/top-50/">Watch the top 50</a></p>
</div></section>
<div class="wrap" id="wall">
  <div class="filters wall-filters"><div class="row">
    <label class="grow"><span>Search the wall</span><input type="search" id="wallQ" placeholder="Project, builder, tag…" autocomplete="off"></label>
    <label><span>Hackathon</span><select id="wallH"><option value="">All hackathons</option>${wallHks.map(([k, t]) => `<option value="${esc(k)}">${esc(t)}</option>`).join('')}</select></label>
  </div></div>
  <p class="count" id="wallCount" role="status" aria-live="polite"><b>${entries.length}</b> project${entries.length === 1 ? '' : 's'} on the wall</p>
  <div class="results" id="wallList">${entries.map(wallCard).join('\n')}
  <a class="card add-card" href="/submit/"><b>+ Your project here</b><span>Post your hackathon build free. Takes two minutes.</span></a></div>
  <p class="empty" id="wallEmpty" hidden>No entries match yet. <a href="/submit/">Be the first to post one.</a></p>
</div>
${prose(`<h2>How the wall works</h2>
<ol><li><strong>Post your project</strong> with the <a href="/submit/">short form</a>: your links, a one-line pitch and the hackathon you entered.</li>
<li><strong>We check it.</strong> Every entry is reviewed before it goes up, usually within a couple of days, so the wall stays free of spam and broken links.</li>
<li><strong>It goes live</strong> under its hackathon, and shows up next to that event on the <a href="/top-50/">top 50</a>.</li></ol>
<h2>What we accept</h2>
<p>Real projects entered in a real hackathon, posted by someone on the team. Links must go to your own project. We don't publish email addresses, and you can ask us to take your entry down at any time.</p>
<p>Posting here doesn't change your official submission. Each hackathon's own platform is still where judging happens, so follow its rules on when you can edit or share your work.</p>`)}
<script type="module" src="/assets/wall.js"></script>`,
});

// ---------- Submit form + thanks ----------
const FORM_TO = 'https://formsubmit.co/info@eyetoad.com';
const hkOptions = sortEvents(events.filter((e) => e.prizeUsd), 'prize', now).slice(0, 200).map((e) => `<option value="${esc(e.title)}"></option>`).join('');
await page({
  path: '/submit/', title: 'Post Your Hackathon Project to the Entry Wall | Hackathon Tracker',
  description: 'Add your hackathon project to the public entry wall for free. Share your live demo, Devpost page, code and video with judges, sponsors and other builders.',
  body: `<section class="hero small"><div class="wrap">
  <h1>Put your build on the wall.</h1>
  <p class="lede">Free, two minutes, reviewed before it goes live.</p>
</div></section>
<div class="wrap">
<form class="filters subform" method="POST" action="${FORM_TO}" accept-charset="UTF-8">
  <input type="hidden" name="_subject" value="Entry wall: new project submitted">
  <input type="hidden" name="_next" value="${SITE}/submit/thanks/">
  <input type="hidden" name="_template" value="table">
  <input type="hidden" name="_autoresponse" value="Thanks for posting your project to the Hackathon Tracker entry wall. We review every entry by hand and will add yours once it checks out.">
  <label class="hp" aria-hidden="true">Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>
  <fieldset><legend>Your project</legend>
  <div class="row">
    <label><span>Project name *</span><input type="text" name="project" required maxlength="80" placeholder="Project name"></label>
    <label><span>Your name or team *</span><input type="text" name="builder" required maxlength="80" placeholder="Your name"></label>
  </div>
  <label class="full"><span>One-line pitch *</span><input type="text" name="pitch" required maxlength="160" placeholder="What it does, in one sentence"></label>
  <div class="row">
    <label><span>Hackathon you entered *</span><input type="text" name="hackathon" required maxlength="120" list="hkList" placeholder="Start typing to pick one"></label>
    <label><span>Hackathon page link</span><input type="url" name="hackathon_link" maxlength="300" placeholder="https://"></label>
  </div>
  <datalist id="hkList">${hkOptions}</datalist>
  </fieldset>
  <fieldset><legend>Links</legend>
  <div class="row">
    <label><span>Live site or demo *</span><input type="url" name="site_url" required maxlength="300" placeholder="https://"></label>
    <label><span>Devpost or entry page</span><input type="url" name="devpost_url" maxlength="300" placeholder="https://"></label>
  </div>
  <div class="row">
    <label><span>Code repo</span><input type="url" name="code_url" maxlength="300" placeholder="https://"></label>
    <label><span>Demo video</span><input type="url" name="video_url" maxlength="300" placeholder="https://"></label>
  </div>
  <label class="full"><span>Tags (up to 5, comma separated)</span><input type="text" name="tags" maxlength="120" placeholder="ai agents, payments, health"></label>
  </fieldset>
  <fieldset><legend>So we can reach you</legend>
  <label class="full"><span>Email * (never published)</span><input type="email" name="email" required maxlength="120" placeholder="you@example.com"></label>
  </fieldset>
  <label class="chk"><input type="checkbox" name="confirm_owner" value="yes" required> I'm on the team that built this project and the links are ours.</label>
  <label class="chk"><input type="checkbox" name="confirm_listing" value="yes" required> I agree to have this project shown publicly on Hackathon Tracker, and I know I can ask for it to be removed at any time.</label>
  <label class="chk"><input type="checkbox" name="confirm_rules" value="yes" required> Posting here doesn't break my hackathon's rules.</label>
  <p><button class="btn" type="submit">Submit for review</button></p>
  <p class="small">Your entry is emailed to us for review and is not published until we approve it. We keep your email only to contact you about your entry. See our <a href="/privacy/">privacy page</a>.</p>
</form>
</div>`,
});
await page({
  path: '/submit/thanks/', noindex: true, title: 'Thanks, Your Project Is In | Hackathon Tracker', description: 'Your project was sent for review.',
  body: `<section class="hero small"><div class="wrap"><h1>Got it. Your project is in review.</h1>
  <p class="lede">We check every entry by hand. Once it's approved it shows up on the wall.</p>
  <p class="ctas"><a class="btn" href="/submissions/">See the entry wall</a><a class="btn ghost" href="/top-50/">Watch the top 50</a></p></div></section>`,
});

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
