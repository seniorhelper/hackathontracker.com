import { pathToFileURL } from 'node:url';

export const name = 'ethglobal';
export const label = 'ETHGlobal';
export const homepage = 'https://ethglobal.com/events';

const UA = 'HackathonTrackerBot/0.1';
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

// The /events page is server-rendered HTML; the "Upcoming" section holds one card per event with
// month, day(s), title, city, country and a type badge ("IRL Hackathon", "Conference", ...).
// Cards show no year, so it is taken from the event slug (e.g. "cannes2027"), else the current year.
export async function fetchEvents() {
  const res = await fetch('https://ethglobal.com/events', { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`ethglobal: HTTP ${res.status}`);
  const html = await res.text();
  const i = html.indexOf('>Upcoming<!--');
  if (i < 0) throw new Error('ethglobal: "Upcoming" section not found (layout changed?)');
  let j = html.indexOf('>Past<', i);
  if (j < 0) j = html.length;
  const section = html.slice(i, j);
  const chunks = section.split(/<a [^>]*href="(\/events\/[^"]+)"/).slice(1);
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  const seen = new Set();
  for (let k = 0; k < chunks.length; k += 2) {
    const href = chunks[k];
    const body = chunks[k + 1];
    const text = body
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<img[^>]*>/g, '')
      .replace(/<[^>]+>/g, '|')
      .replace(/\|+/g, '|');
    // |April|14|16|Wed|—|Fri|ETHGlobal Cannes 2027|Cannes|, |France|IRL Hackathon|
    const re = /\|([A-Za-z]{3,9})\|(\d{1,2})\|(?:(\d{1,2})\|)?(?:[A-Za-z]{3}\|(?:—\|[A-Za-z]{3}\|)?)?([^|]+)\|([^|]+)\|, \|([^|]+)\|([^|]*Hackathon[^|]*)\|/g;
    let m;
    while ((m = re.exec(text))) {
      const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
      if (!mon) continue;
      const slug = href.replace('/events/', '');
      if (seen.has(slug)) continue;
      const ym = slug.match(/(20\d\d)/);
      const year = ym ? +ym[1] : new Date().getFullYear();
      const start = `${year}-${pad(mon)}-${pad(m[2])}`;
      const end = `${year}-${pad(mon)}-${pad(m[3] || m[2])}`;
      if (end < today) continue;
      seen.add(slug);
      const type = m[7];
      out.push({
        id: `ethglobal:${slug}`,
        source: 'ethglobal',
        title: decode(m[4]),
        url: `https://ethglobal.com${href}`,
        organizer: 'ETHGlobal',
        start,
        end,
        mode: /online/i.test(type) ? 'online' : /irl/i.test(type) ? 'in-person' : null,
        city: decode(m[5]),
        region: null,
        country: decode(m[6]),
        lat: null,
        lon: null,
        prizeUsd: null,
        prizeText: null,
        registrants: null,
        themes: ['web3', 'ethereum'],
        eligibility: 'unknown',
        inviteOnly: false,
        image: null,
      });
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
