import { pathToFileURL } from 'node:url';

export const name = 'mlh';
export const label = 'Major League Hacking';
export const homepage = 'https://www.mlh.com/seasons/2027/events';

const UA = 'HackathonTrackerBot/0.1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MLH's events page is an Inertia app: the data is a JSON blob in <script data-page="app">.
// Pagination query param for upcoming events is `upcoming_page`.
async function fetchPage(season, page) {
  const res = await fetch(`https://www.mlh.com/seasons/${season}/events?upcoming_page=${page}`, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`mlh: HTTP ${res.status} for season ${season} page ${page}`);
  const html = await res.text();
  const m = html.match(/<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('mlh: embedded page JSON not found (site layout changed?)');
  const data = JSON.parse(m[1]);
  const events = data.props && data.props.upcomingEvents;
  if (!Array.isArray(events)) throw new Error('mlh: props.upcomingEvents missing');
  const next = data.scrollProps && data.scrollProps.upcomingEvents ? data.scrollProps.upcomingEvents.nextPage : null;
  return { events, next };
}

export async function fetchEvents() {
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const seasons = [year + 1, year];
  const out = [];
  const seen = new Set();
  let used = 0;
  for (const season of seasons) {
    let page = 1;
    let got = 0;
    while (page && used < 15) {
      let r;
      try {
        r = await fetchPage(season, page);
      } catch (e) {
        if (got === 0 && out.length === 0 && season !== seasons[seasons.length - 1]) break; // try older season
        throw e;
      }
      used++;
      got += r.events.length;
      for (const e of r.events) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        const end = e.endsAt ? e.endsAt.slice(0, 10) : null;
        const start = e.startsAt ? e.startsAt.slice(0, 10) : null;
        if ((end || start) && (end || start) < today) continue;
        const ft = e.formatType || '';
        const mode = /hybrid/.test(ft) ? 'hybrid' : /digital|virtual|online/.test(ft) ? 'online' : /physical/.test(ft) ? 'in-person' : null;
        const va = e.venueAddress || {};
        out.push({
          id: `mlh:${e.slug || e.id}`,
          source: 'mlh',
          title: e.name,
          url: e.url ? new URL(e.url.replace(/\/prizes$/, ''), 'https://www.mlh.com').href : e.websiteUrl,
          organizer: e.organizationName || null,
          start,
          end,
          mode,
          city: va.city || null,
          region: va.state || null,
          country: va.country || null,
          lat: null,
          lon: null,
          prizeUsd: null,
          prizeText: null,
          registrants: null,
          themes: [],
          eligibility: 'students',
          inviteOnly: false,
          image: e.backgroundUrl || e.logoUrl || null,
        });
      }
      page = r.next;
      if (page) await sleep(1000);
    }
    if (got > 0) break; // newest season with data is enough
    await sleep(1000);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
