# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Julian Fife's personal website, served via GitHub Pages at **julianfife.com** (see `public/CNAME`). It is an **Astro** static site: pages are authored in `src/pages/`, assets live in `public/`, and `astro build` emits a static `dist/` that GitHub Pages serves. There is no backend — GitHub Pages can only serve static files, so SSR / API routes are not available without changing hosts.

> **Migration in progress (branch `astro-migration`).** The site is being migrated from a hand-authored static-HTML site to Astro. The Astro app under `src/` is the source of truth. The original root-level `index.html`, `concert-log.html`, and `travel-log.html` are **legacy**, kept only as a reference diff; they are not part of the build and get removed at the live cutover. Don't edit them.

## Commands

```sh
npm install        # once
npm run dev        # local dev server at http://localhost:4321
npm run build      # static build into dist/
npm run preview    # serve the built dist/ locally
```

No test suite. "Verifying" means building and eyeballing in the browser (especially the Leaflet maps and the live Google-Sheet fetch, which only exercise in a real browser).

## Pages

- `src/pages/index.astro` — homepage / link hub. Static content.
- `src/pages/concert-log.astro` — "Live Events": tabbed (Music / Stand-Up / Football) timeline + Leaflet map + stats. Routed at `/concert-log/`.
- `src/pages/travel-log.astro` — map-first travel log. Routed at `/travel-log/`. A sibling of concert-log; they share CSS variables, a CSV parser, the dark theme, person-avatars, and Leaflet setup.

The two logs are currently **faithful ports** of the original HTML: the entire original `<style>` and app `<script>` are wrapped in `is:inline`, so Astro emits them **verbatim** (no bundling, scoping, or minification). The only edits made during the port were relative→root-absolute asset paths (see below). This means the logs are still two large single-file apps with duplicated logic — deduping them into `src/lib` + `src/components` is planned follow-up work, not yet done.

## Data flow (the important architecture)

Both logs are driven by a **published Google Sheet, not local data** — this is easy to forget because there's no trace of it in the repo. Each log has a `const SHEET_CSV_URL` (a Sheet's "Publish to web → CSV" link) near the top of its `<script>`. At runtime the page fetches that CSV, parses it (`parseCSV`), maps rows to objects (`rowsToShows` / `rowsToTrips`), caches the result in `localStorage`, and falls back to the most recent cache (then a small built-in array) if the fetch fails.

So **editing log content means editing the Google Sheet, not this repo.** Code changes here are for rendering, layout, columns, or categories. `concert-data-for-sheet.tsv` (untracked) is a scratch export for populating the sheet; the site never reads it.

- Concert sheet columns: `date | venue | city | state | tour | type | artists | image | friends | league | note`. `type` (`Concert`/`Festival` → Music, `Stand-Up` → Stand-Up, `Football` → Football) selects the tab. `artists`/`friends` are semicolon-separated. Deep-link tabs with `#music` / `#standup` / `#football`.
- Travel sheet columns: `date_start | date_end | trip_id | trip_name | place | region | country | lat | lng | friends | photo_folder | photos | story | tags`. Rows sharing a `trip_id` group into one multi-stop trip.

**Map coordinates differ:** travel-log reads lat/lng per-row from the sheet (new place = no code change); concert-log uses a baked-in `VENUES` map inside the file, so a new venue must be added there or it renders everywhere except the map.

> Planned: move the Sheet fetch to **build time** (bake data into the HTML to kill the load-flash and make content crawlable) while keeping a client-side refresh island for live updates. Not yet implemented — today's behavior is still the original client-side fetch.

## Assets & path convention

All static assets live in `public/` and are served from the site root. Reference them with **root-absolute** paths (`/people/<slug>.jpg`, `/venues/<slug>.png`) — *not* relative — because the logs render at sub-routes (`/concert-log/`) where relative paths would resolve wrong. Lookups are by slugified name with `onerror` fallbacks, so a missing file degrades gracefully and you can reference a name before the asset exists.

- `public/people/<slug>.jpg` — friends in either log; missing → colored initials circle.
- `public/venues/<slug>.png` — concert venue logos.
- `public/leagues/<slug>.png`, `public/bowls/<slug>.png` — football league badges / bowl logos.
- `public/trips/<photo_folder>/<file>` — travel photos. See `public/trips/README.md` for the folder convention and sizing guidance; a `photos` value starting with `http` is treated as a full URL/CDN link.

Concert-log artist/team avatars are **not** local: they're fetched at runtime from the Wikipedia API (`_wikiThumb` / `_wikiBatch` / `_wikiSummaryThumb`), cached in `localStorage` ~30 days. `_IMG_HINTS` disambiguates names Wikipedia bare-search gets wrong (common-noun bands, NCAAF "<team> football" articles); add an entry there when an avatar resolves wrong. The sheet's `image` column overrides the auto-pick for a row's headliner.

## Deploy

`.github/workflows/deploy.yml` builds the site and publishes `dist/` to GitHub Pages on push to `main`. It is **inert until the repo's Pages source is switched** from "Deploy from a branch" to "GitHub Actions" (Settings → Pages). Until that cutover the live site keeps serving the old branch-based setup, so merging migration work to `main` does not change production by itself. `public/CNAME` carries the custom domain into `dist/`.
