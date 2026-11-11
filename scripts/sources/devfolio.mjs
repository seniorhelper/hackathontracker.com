import { pathToFileURL } from 'node:url';

export const name = 'devfolio';
export const label = 'Devfolio';
export const homepage = 'https://devfolio.co/hackathons';

const UA = 'HackathonTrackerBot/0.1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(type, from, size) {
  const res = await fetch('https://api.devfolio.co/api/search/hackathons', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ type, from, size }),
  });
  if (!res.ok) throw new Error(`devfolio: HTTP ${res.status} for type=${type}`);
  const json = await res.json();
  if (!json.hits || !Array.isArray(json.hits.hits)) throw new Error('devfolio: unexpected response shape');
  return json.hits.hits.map((h) => h._source);
}

export async function fetchEvents() {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  const seen = new Set();
  let requests = 0;
  for (const type of ['application_open', 'upcoming']) {
    const size = 50;
    for (let from = 0; requests < 15; from += size) {
      const hits = await search(type, from, size);
      requests++;
      for (const s of hits) {
        if (seen.has(s.uuid)) continue;
        seen.add(s.uuid);
        const end = s.ends_at ? s.ends_at.slice(0, 10) : null;
        const start = s.starts_at ? s.starts_at.slice(0, 10) : null;
        if ((end || start) && (end || start) < today) continue;
        const hs = s.hackathon_setting || {};
        out.push({
          id: `devfolio:${s.slug || s.uuid}`,
          source: 'devfolio',
          title: s.name,
          url: `https://${s.slug}.devfolio.co/`,
          organizer: s.hosted_by || null,
          start,
          end,
          mode: s.is_online === true ? 'online' : s.is_online === false ? 'in-person' : null,
          city: s.city || null,
          region: s.state || null,
          country: s.country || null,
          lat: null,
          lon: null,
          prizeUsd: null, // Devfolio prizes are free text / mostly INR; not reliably USD
          prizeText: null,
          registrants: typeof s.participants_count === 'number' ? s.participants_count : null,
          themes: (s.themes || []).map((t) => String(t.name).toLowerCase()),
          eligibility: 'unknown',
          inviteOnly: !!s.private,
          image: hs.logo || s.cover_img || null,
        });
      }
      if (hits.length < size) break;
      await sleep(1000);
    }
    await sleep(1000);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
