import { pathToFileURL } from 'node:url';

export const name = 'unstop';
export const label = 'Unstop';
export const homepage = 'https://unstop.com/hackathons';

const UA = 'HackathonTrackerBot/0.1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// robots.txt: "Disallow: /api/*" but explicit "Allow: /api/public/*" -- this endpoint is under /api/public/.
export async function fetchEvents() {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  const seen = new Set();
  let last = 1;
  for (let page = 1; page <= Math.min(last, 15); page++) {
    const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&oppstatus=open&per_page=30&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`unstop: HTTP ${res.status} on page ${page}`);
    const json = await res.json();
    const d = json.data;
    if (!d || !Array.isArray(d.data)) throw new Error('unstop: unexpected response shape');
    last = d.last_page || 1;
    for (const e of d.data) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      const end = e.end_date ? String(e.end_date).slice(0, 10) : null;
      if (end && end < today) continue;
      const addr = e.address_with_country_logo || {};
      const cash = (e.prizes || []).filter((p) => p.cash);
      let prizeUsd = null;
      let prizeText = null;
      if (cash.length) {
        const cur = new Set(cash.map((p) => p.currencyCode || p.currency));
        const total = cash.reduce((s, p) => s + Number(p.cash), 0);
        if (cur.size === 1) {
          const c = [...cur][0];
          const sym = /rupee|INR/i.test(c) ? 'INR ' : /dollar|USD/i.test(c) ? '$' : '';
          prizeText = `${sym}${total.toLocaleString('en-US')}`;
          if (/dollar|USD/i.test(c)) prizeUsd = total;
        }
      }
      const filterNames = (e.filters || []).map((f) => String(f.name).toLowerCase());
      let eligibility = 'unknown';
      if (filterNames.length === 1 && filterNames[0] === 'all') eligibility = 'everyone';
      else if (filterNames.length && filterNames.every((n) => /student|college|school|undergrad|graduate/.test(n))) eligibility = 'students';
      out.push({
        id: `unstop:${e.id}`,
        source: 'unstop',
        title: e.title,
        url: e.seo_url || `https://unstop.com/${e.public_url}`,
        organizer: e.organisation && e.organisation.name ? e.organisation.name : null,
        start: null, // API exposes the registration window, not the event start
        end,
        mode: e.region === 'online' ? 'online' : e.region === 'hybrid' ? 'hybrid' : e.region === 'offline' ? 'in-person' : null,
        city: addr.city || null,
        region: addr.state || null,
        country: addr.country && addr.country.name ? addr.country.name : null,
        lat: typeof addr.lat === 'number' ? addr.lat : null,
        lon: typeof addr.lng === 'number' ? addr.lng : null,
        prizeUsd,
        prizeText,
        registrants: typeof e.registerCount === 'number' ? e.registerCount : null,
        themes: (e.workfunction || []).map((w) => String(w.name).toLowerCase()),
        eligibility,
        inviteOnly: e.visibility !== 'public',
        image: e.logoUrl2 || (e.organisation && e.organisation.logoUrl) || null,
      });
    }
    if (page < Math.min(last, 15)) await sleep(1000);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ev = await fetchEvents();
  console.log(`${name}: ${ev.length} events`);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
