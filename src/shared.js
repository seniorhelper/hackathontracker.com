// Shared by the build script (Node) and the browser. No dependencies.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n) => (n == null ? null : '$' + Math.round(n).toLocaleString('en-US'));

export const todayStr = (now = new Date()) => now.toISOString().slice(0, 10);

export function daysUntil(d, now = new Date()) {
  if (!d) return null;
  return Math.round((Date.parse(d) - Date.parse(todayStr(now))) / 864e5);
}

export function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function distKm(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export const DEFAULTS = {
  q: '', mode: 'any', place: '', hideStudent: false, beginner: false, ai: false,
  minPrize: 0, within: 0, odds: 'any', source: 'any', sort: 'best', saved: false, near: null, km: 160,
};

export const SORTS = {
  best: 'Best odds first',
  prize: 'Biggest prize',
  soon: 'Closing soonest',
  quiet: 'Fewest competitors',
  new: 'Newly listed',
};

export function placeText(e) {
  return [e.city, e.region, e.country].filter(Boolean).join(', ');
}

export function applyFilters(events, f, now = new Date(), savedIds = null) {
  const q = (f.q || '').trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  const place = (f.place || '').trim().toLowerCase();
  return events.filter((e) => {
    if (f.saved && !(savedIds && savedIds.has(e.id))) return false;
    if (terms.length) {
      const hay = [e.title, e.organizer, placeText(e), (e.themes || []).join(' '), e.sourceLabel].join(' ').toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    if (f.mode === 'online' && e.mode !== 'online' && e.mode !== 'hybrid') return false;
    if (f.mode === 'in-person' && e.mode !== 'in-person' && e.mode !== 'hybrid') return false;
    if (place && !placeText(e).toLowerCase().includes(place)) return false;
    if (f.hideStudent && (e.eligibility === 'students' || e.eligibility === 'high-school')) return false;
    if (f.beginner && !e.beginner) return false;
    if (f.ai && !e.ai) return false;
    if (f.minPrize > 0 && !(e.prizeUsd >= f.minPrize)) return false;
    if (f.within > 0) {
      const d = daysUntil(e.end, now);
      if (d == null || d > f.within) return false;
    }
    if (f.odds === 'strong' && e.oddsTier !== 'strong') return false;
    if (f.odds === 'fair' && e.oddsTier !== 'strong' && e.oddsTier !== 'fair') return false;
    if (f.source !== 'any' && e.source !== f.source) return false;
    if (f.near) {
      if (e.lat == null || e.lon == null) return false;
      if (distKm(f.near.lat, f.near.lon, e.lat, e.lon) > (f.km || 160)) return false;
    }
    return true;
  });
}

const cmpNullLast = (a, b, dir = 1) => (a == null && b == null ? 0 : a == null ? 1 : b == null ? -1 : (a - b) * dir);

export function sortEvents(list, sort, now = new Date()) {
  const byEnd = (a, b) => cmpNullLast(daysUntil(a.end, now), daysUntil(b.end, now));
  const out = [...list];
  if (sort === 'prize') out.sort((a, b) => cmpNullLast(a.prizeUsd, b.prizeUsd, -1) || byEnd(a, b));
  else if (sort === 'soon') out.sort(byEnd);
  else if (sort === 'quiet') out.sort((a, b) => cmpNullLast(a.registrants, b.registrants) || byEnd(a, b));
  else if (sort === 'new') out.sort((a, b) => (b.firstSeen || '').localeCompare(a.firstSeen || '') || byEnd(a, b));
  else out.sort((a, b) => cmpNullLast(a.perReg, b.perReg, -1) || cmpNullLast(a.prizeUsd, b.prizeUsd, -1) || byEnd(a, b));
  return out;
}

const ODDS_LABEL = { strong: 'Strong odds', fair: 'Fair odds', crowded: 'Crowded' };

// Stable, lowercase page slug for an event: title words plus a short hash of its id.
export function slugFor(e) {
  let h = 2166136261;
  for (const c of String(e.id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const base = String(e.title).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return (base || 'hackathon') + '-' + h.toString(36).slice(0, 5);
}
export const eventPath = (e) => `/hackathons/${e.slug || slugFor(e)}/`;

export function whereText(e) {
  if (e.mode === 'online') return 'Online';
  const p = placeText(e);
  if (e.mode === 'hybrid') return p ? p + ' + online' : 'Online + in person';
  return p || (e.mode === 'in-person' ? 'In person' : 'Location not listed');
}

export function countdown(e, now = new Date()) {
  const d = daysUntil(e.end, now);
  if (d == null) return { text: e.start ? 'Starts ' + fmtDate(e.start) : 'Dates TBA', cls: 'tba' };
  if (d < 0) return { text: 'Closed', cls: 'closed' };
  if (d === 0) return { text: 'Ends today', cls: 'hot' };
  if (d === 1) return { text: '1 day left', cls: 'hot' };
  return { text: `${d} days left`, cls: d <= 7 ? 'hot' : d <= 30 ? 'soon' : '' };
}

export function deadlineText(e, now = new Date()) {
  const d = daysUntil(e.end, now);
  if (d == null) return e.start ? 'Starts ' + fmtDate(e.start) : 'Dates not listed';
  const s = daysUntil(e.start, now);
  if (s != null && s > 0 && e.mode !== 'online') return `${fmtDate(e.start)} – ${fmtDate(e.end)}`;
  if (d === 0) return 'Closes today';
  if (d === 1) return 'Closes tomorrow';
  return `Closes ${fmtDate(e.end)}`;
}

const ymd = (d) => d.replace(/-/g, '');
const nextDay = (d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10);
const calDetails = (e) => [e.prizeUsd ? money(e.prizeUsd) + ' in prizes' : e.prizeText, whereText(e), 'Official page: ' + e.url, 'Check the official rules for the exact closing time and time zone.'].filter(Boolean).join('\n');

export function gcalUrl(e) {
  if (!e.end) return null;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: 'Deadline: ' + e.title, dates: `${ymd(e.end)}/${ymd(nextDay(e.end))}`, details: calDetails(e), location: e.mode === 'online' ? e.url : placeText(e) || e.url });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function cardHTML(e, now = new Date(), isSaved = false) {
  const c = countdown(e, now);
  const facts = [];
  if (e.prizeUsd) facts.push(`<div class="fact prize"><b>${money(e.prizeUsd)}</b><span>in prizes</span></div>`);
  else if (e.prizeText) facts.push(`<div class="fact prize text"><b>${esc(e.prizeText.slice(0, 26))}</b><span>prizes</span></div>`);
  else facts.push('<div class="fact prize none"><b>Not listed</b><span>prizes</span></div>');
  if (e.registrants != null) facts.push(`<div class="fact"><b>${e.registrants.toLocaleString('en-US')}</b><span>signed up</span></div>`);
  if (e.perReg != null) facts.push(`<div class="fact"><b>${money(e.perReg)}</b><span>per entrant</span></div>`);
  const badges = [];
  if (e.oddsTier) badges.push(`<span class="badge odds-${e.oddsTier}">${ODDS_LABEL[e.oddsTier]}</span>`);
  else if (e.early) badges.push(`<span class="badge odds-early">Just opened</span>`);
  if (e.isNew) badges.push('<span class="badge new">New</span>');
  if (e.eligibility === 'students') badges.push('<span class="badge elig">Students only</span>');
  if (e.eligibility === 'high-school') badges.push('<span class="badge elig">High school</span>');
  if (e.eligibility === 'everyone') badges.push('<span class="badge open">Open to all</span>');
  if (e.beginner) badges.push('<span class="badge plain">Beginner friendly</span>');
  if (e.ai) badges.push('<span class="badge plain">AI</span>');
  if (e.inviteOnly) badges.push('<span class="badge elig">Invite only</span>');
  const also = (e.alsoOn || []).map((a) => `<a href="${esc(a.url)}" rel="noopener" target="_blank">${esc(a.label)}</a>`).join(', ');
  const path = eventPath(e);
  const g = gcalUrl(e);
  const where = whereText(e);
  return `<article class="card${c.cls === 'hot' ? ' urgent' : ''}" data-id="${esc(e.id)}">
  <div class="card-head"><span class="clock ${c.cls}">${esc(c.text)}</span>
    <button class="save" type="button" aria-pressed="${isSaved}" data-save="${esc(e.id)}" aria-label="${isSaved ? 'Remove from' : 'Save to'} my hackathons: ${esc(e.title)}" title="Save to my hackathons">${isSaved ? '★' : '☆'}<span>${isSaved ? 'Saved' : 'Save'}</span></button></div>
  <h3><a href="${path}">${esc(e.title)}</a></h3>
  <p class="meta">${esc(where)}${e.organizer && !where.toLowerCase().includes(e.organizer.toLowerCase()) ? ' · ' + esc(e.organizer) : ''} · ${esc(deadlineText(e, now))}</p>
  <div class="facts">${facts.join('')}</div>
  ${badges.length ? `<p class="badges">${badges.join('')}</p>` : ''}
  <div class="card-actions"><a class="btn sm" href="${esc(e.url)}" rel="noopener" target="_blank">Official page <span aria-hidden="true">↗</span></a>${g ? `<details class="cal"><summary class="btn sm ghost">Add to calendar</summary><div class="cal-menu"><a href="${esc(g)}" rel="noopener" target="_blank">Google Calendar</a><a href="${path}deadline.ics" download>Apple, Outlook (.ics)</a></div></details>` : ''}</div>
  <p class="src">Listed on ${esc(e.sourceLabel)}${also ? ', ' + also : ''}</p>
</article>`;
}

// ---------- iCalendar (RFC 5545) ----------
const enc = new TextEncoder();
// Escape TEXT values: backslash, semicolon, comma and newlines.
export const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
// Fold content lines longer than 75 octets (UTF-8 safe), continuation lines start with one space.
export function icsFold(line) {
  if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = ''; let len = 0; let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (len + n > limit) { out.push(cur); cur = ''; len = 0; limit = 74; }
    cur += ch; len += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function icsFor(events, calName = 'Hackathon deadlines', opts = {}) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const site = opts.site || 'https://hackathontracker.com';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hackathon Tracker//hackathontracker.com//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsText(calName), 'X-WR-CALDESC:' + icsText('Hackathon deadlines from hackathontracker.com. Always confirm the exact time on the official page.')];
  if (opts.feed) lines.push('REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H');
  for (const e of events) {
    if (!e.end) continue;
    const slug = e.slug || slugFor(e);
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + slug + '@hackathontracker.com',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + ymd(e.end),
      'DTEND;VALUE=DATE:' + ymd(nextDay(e.end)),
      'SUMMARY:' + icsText('Deadline: ' + e.title),
      'DESCRIPTION:' + icsText(calDetails(e) + '\nDetails: ' + site + '/hackathons/' + slug + '/'),
      'URL:' + e.url,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText('3 days left: ' + e.title), 'TRIGGER:-P3D', 'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n') + '\r\n';
}
