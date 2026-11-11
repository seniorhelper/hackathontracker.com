# hackathontracker.com

A search engine for hackathons, ranked by prize money per entrant.

- `node scripts/build.mjs` reads the live sources and builds the site into `dist/`.
- `node scripts/build.mjs --offline` rebuilds from the last cached data.
- `node scripts/serve.mjs` previews `dist/` at http://localhost:4173.
- Page wording lives in `scripts/pages.mjs`; blog posts are HTML files in `content/blog/`.
- Brand colours are the tokens at the top of `src/styles.css`.
- A GitHub Action rebuilds and publishes the site once a day.
