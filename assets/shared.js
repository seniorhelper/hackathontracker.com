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

export function deadlineText(e, now = new Date()) {
  const d = daysUntil(e.end, now);
  if (d == null) return e.start ? 'Starts ' + fmtDate(e.start) : 'Dates not listed';
  const s = daysUntil(e.start, now);
  if (s != null && s > 0 && e.mode !== 'online') return `${fmtDate(e.start)} – ${fmtDate(e.end)}`;
  if (d === 0) return 'Closes today';
  if (d === 1) return 'Closes tomorrow';
  return `Closes in ${d} days (${fmtDate(e.end)})`;
}

export function cardHTML(e, now = new Date(), isSaved = false) {
  const d = daysUntil(e.end, now);
  const where = e.mode === 'online' ? 'Online' : placeText(e) || (e.mode === 'in-person' ? 'In person' : 'Location not listed');
  const facts = [];
  if (e.prizeUsd) facts.push(`<div class="fact"><b>${money(e.prizeUsd)}</b><span>in prizes</span></div>`);
  else if (e.prizeText) facts.push(`<div class="fact"><b>${esc(e.prizeText.slice(0, 22))}</b><span>prizes</span></div>`);
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
  if (e.inviteOnly) badges.push('<span class="badge elig">Invite only</span>');
  const themes = (e.themes || []).slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const also = (e.alsoOn || []).map((a) => `<a href="${esc(a.url)}" rel="noopener" target="_blank">${esc(a.label)}</a>`).join(', ');
  return `<article class="card${d != null && d <= 3 ? ' urgent' : ''}" data-id="${esc(e.id)}">
  <div class="card-top">
    <h3><a href="${esc(e.url)}" rel="noopener" target="_blank">${esc(e.title)}</a></h3>
    <button class="save" type="button" aria-pressed="${isSaved}" data-save="${esc(e.id)}" title="Save to your list">${isSaved ? '★ Saved' : '☆ Save'}</button>
  </div>
  <p class="meta">${e.organizer && !where.toLowerCase().includes(e.organizer.toLowerCase()) ? esc(e.organizer) + ' · ' : ''}${esc(where)} · ${esc(deadlineText(e, now))}</p>
  ${badges.length ? `<p class="badges">${badges.join('')}</p>` : ''}
  ${facts.length ? `<div class="facts">${facts.join('')}</div>` : ''}
  <p class="foot">${themes}<span class="src">Listed on ${esc(e.sourceLabel)}${also ? ', ' + also : ''}</span>${e.end ? `<button class="link" type="button" data-ics="${esc(e.id)}">Add deadline to calendar</button>` : ''}</p>
</article>`;
}

export function icsFor(events, calName = 'Hackathon deadlines') {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const fold = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, ' ');
  const next = (d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//hackathontracker.com//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + fold(calName)];
  for (const e of events) {
    if (!e.end) continue;
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + fold(e.id) + '@hackathontracker.com',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + e.end.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + next(e.end),
      'SUMMARY:' + fold('Deadline: ' + e.title),
      'DESCRIPTION:' + fold((e.prizeUsd ? money(e.prizeUsd) + ' in prizes. ' : '') + e.url),
      'URL:' + fold(e.url),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
