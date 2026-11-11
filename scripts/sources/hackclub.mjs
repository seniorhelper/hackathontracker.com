import { pathToFileURL } from 'node:url';

export const name = 'hackclub';
export const label = 'Hack Club Hackathons';
export const homepage = 'https://hackathons.hackclub.com/';

const UA = 'HackathonTrackerBot/0.1';
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export async function fetchEvents() {
  const res = await fetch('https://hackathons.hackclub.com/api/events/upcoming', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`hackclub: HTTP ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error('hackclub: unexpected response shape (expected array)');
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (const e of list) {
    const start = e.start ? String(e.start).slice(0, 10) : null;
    const end = e.end ? String(e.end).slice(0, 10) : null;
    if ((end || start) && (end || start) < today) continue;
    out.push({
      id: `hackclub:${e.id}`,
      source: 'hackclub',
      title: e.name,
      url: e.website || homepage,
      organizer: null,
      start,
      end,
      mode: e.hybrid ? 'hybrid' : e.virtual ? 'online' : e.city || e.country ? 'in-person' : null,
      city: e.city || null,
      region: e.state || null,
      country: e.country || null,
      lat: num(e.latitude),
      lon: num(e.longitude),
      prizeUsd: null,
      prizeText: null,
      registrants: null,
      themes: [],
      eligibility: 'high-school',
      inviteOnly: false,
      image: e.logo || e.banner || null,
    });
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
