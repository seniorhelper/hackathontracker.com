# hackathontracker.com

A search engine for hackathons, ranked by prize money per entrant.

- `node scripts/build.mjs` reads the live sources and builds the site into `dist/`.
- `node scripts/build.mjs --offline` rebuilds from the last cached data.
- `node scripts/serve.mjs` previews `dist/` at http://localhost:4173.
- Page wording lives in `scripts/pages.mjs`; blog posts are HTML files in `content/blog/`.
- Brand colours are the tokens at the top of `src/styles.css`.
- A GitHub Action rebuilds and publishes the site once a day.

## Top 50 and the entry wall
- `/top-50/` ranks the 50 biggest open US-dollar prize pools; visitors can re-sort by deadline, odds or fewest entrants.
- `/submit/` emails each new project to info@eyetoad.com through FormSubmit for review. Nothing is published automatically.
- To approve one, add it to `content/submissions.json` (format is described at the top of that file), rebuild and publish. It then shows on `/submissions/` and next to its hackathon on the top 50.
