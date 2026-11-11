# Source adapter contract

Each file `scripts/sources/<name>.mjs` (Node 24, ESM, built-in fetch, NO npm dependencies) exports:

    export const name = 'devpost';            // short id
    export const label = 'Devpost';           // display name
    export const homepage = 'https://devpost.com/hackathons';
    export async function fetchEvents() { return [ ...normalized events ] }

Normalized event (use null when unknown — never guess):

    {
      id: 'devpost:12345',          // `${name}:${stable source id or slug}`
      source: 'devpost',
      title: string,
      url: string,                  // link to the ORIGINAL listing
      organizer: string|null,
      start: 'YYYY-MM-DD'|null,     // event/submission start
      end: 'YYYY-MM-DD'|null,       // event end / submission deadline
      mode: 'online'|'in-person'|'hybrid'|null,
      city: string|null, region: string|null, country: string|null,
      lat: number|null, lon: number|null,
      prizeUsd: number|null,        // total cash prize in USD, numeric; null if not stated or non-USD
      prizeText: string|null,       // original prize string
      registrants: number|null,     // people/teams registered, if the source shows it
      themes: string[],             // lowercased tags
      eligibility: 'everyone'|'students'|'high-school'|'unknown',
      inviteOnly: boolean,
      image: string|null
    }

Rules: be polite (1 request/sec max, real User-Agent "HackathonTrackerBot/0.1"), cap at 15 pages
per source, throw a clear Error on failure (the build catches it and keeps the other sources),
only return events that are open or upcoming. Running `node scripts/sources/<name>.mjs` directly
must print the count and the first 2 events as JSON (self-test).
