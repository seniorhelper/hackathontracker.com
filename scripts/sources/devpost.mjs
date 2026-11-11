import { pathToFileURL } from 'node:url';

export const name = 'devpost';
export const label = 'Devpost';
export const homepage = 'https://devpost.com/hackathons';

const UA = 'HackathonTrackerBot/0.1';
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');

// Parses "Oct 01 - Nov 12, 2026", "Dec 28, 2026 - Jan 15, 2027", "Nov 01 - 14, 2026", "Nov 12, 2026".
export function parseRange(text) {
  if (!text) return { start: null, end: null };
  const parts = String(text).split(/\s+-\s+/);
  const tok = (s) => {
    const m = s.match(/(?:([A-Za-z]{3})[a-z]*\.?\s+)?(\d{1,2})(?:,?\s+(\d{4}))?/);
    if (!m) return null;
    return { mon: m[1] ? MONTHS[m[1].toLowerCase()] : null, day: +m[2], year: m[3] ? +m[3] : null };
  };
  const a = tok(parts[0]);
  const b = parts.length > 1 ? tok(parts[1]) : null;
  if (!a) return { start: null, end: null };
  const last = b || a;
  const year = last.year || a.year;
  if (!year) return { start: null, end: null };
  const endMon = last.mon || a.mon;
  const startMon = a.mon || endMon;
  if (!startMon || !endMon) return { start: null, end: null };
  let startYear = a.year || year;
  if (!a.year && startMon > endMon) startYear = year - 1;
  const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  return { start: fmt(startYear, startMon, a.day), end: b ? fmt(year, endMon, b.day) : fmt(year, startMon, a.day) };
}

function parsePrize(html) {
  if (!html) return { prizeUsd: null, prizeText: null };
  const text = html.replace(/<[^>]+>/g, '').trim();
  if (!text) return { prizeUsd: null, prizeText: null };
  const zero = Number(text.replace(/[^0-9.]/g, '')) === 0;
  if (zero) return { prizeUsd: null, prizeText: null };
  if (!/^\$[\d,.]+/.test(text)) return { prizeUsd: null, prizeText: text }; // non-USD (euro, rupee, "$CAD" ...)
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return { prizeUsd: Number.isFinite(n) && n > 0 ? n : null, prizeText: text };
}

export async function fetchEvents() {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  const seen = new Set();
  let total = Infinity;
  for (let page = 1; page <= 15 && out.length < total; page++) {
    const url = `https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`devpost: HTTP ${res.status} on page ${page}`);
    const json = await res.json();
    const list = json.hackathons;
    if (!Array.isArray(list)) throw new Error('devpost: unexpected response shape (no hackathons array)');
    if (json.meta && json.meta.total_count != null) total = json.meta.total_count;
    if (list.length === 0) break;
    for (const h of list) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      const { start, end } = parseRange(h.submission_period_dates);
      if (end && end < today) continue;
      const loc = h.displayed_location && h.displayed_location.location ? h.displayed_location.location.trim() : null;
      const online = loc && /^online$/i.test(loc);
      const { prizeUsd, prizeText } = parsePrize(h.prize_amount);
      out.push({
        id: `devpost:${h.id}`,
        source: 'devpost',
        title: h.title,
        url: h.url,
        organizer: h.organization_name || null,
        start,
        end,
        mode: loc ? (online ? 'online' : 'in-person') : null,
        city: loc && !online ? loc.split(',')[0].trim() : null,
        region: null,
        country: null,
        lat: null,
        lon: null,
        prizeUsd,
        prizeText,
        registrants: typeof h.registrations_count === 'number' ? h.registrations_count : null,
        themes: (h.themes || []).map((t) => String(t.name).toLowerCase()),
        eligibility: 'unknown',
        inviteOnly: !!h.invite_only,
        image: h.thumbnail_url ? (h.thumbnail_url.startsWith('//') ? 'https:' + h.thumbnail_url : h.thumbnail_url) : null,
      });
    }
    if (page < 15 && out.length < total) await sleep(1000);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
