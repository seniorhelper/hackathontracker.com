// Hand-added hackathons from content/hackathons.json (events none of the automatic sources list).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const name = 'manual';
export const label = "the organizer's site";
export const homepage = null;
export const local = true; // read from the repo, not the network

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'hackathons.json');

export async function fetchEvents() {
  const data = JSON.parse(await readFile(FILE, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (const e of data.events || []) {
    if (!e || !e.id || !e.title || !e.url) continue;
    if (e.end && e.end < today) continue;
    out.push({
      id: `manual:${e.id}`, source: 'manual', title: e.title, url: e.url,
      organizer: e.organizer ?? null, start: e.start ?? null, end: e.end ?? null, mode: e.mode ?? null,
      city: e.city ?? null, region: e.region ?? null, country: e.country ?? null, lat: null, lon: null,
      prizeUsd: typeof e.prizeUsd === 'number' ? e.prizeUsd : null, prizeText: e.prizeText ?? null,
      registrants: typeof e.registrants === 'number' ? e.registrants : null,
      themes: Array.isArray(e.themes) ? e.themes : [],
      eligibility: e.eligibility || 'unknown', inviteOnly: e.inviteOnly === true, image: null,
    });
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const ev = await fetchEvents();
  console.log(ev.length);
  console.log(JSON.stringify(ev.slice(0, 2), null, 2));
}
