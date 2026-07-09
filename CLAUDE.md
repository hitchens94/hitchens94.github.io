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

The site is a **landing page plus five branches**. `/` is deliberately spare — bio, a text directory, personal socials — and every other kind of content lives on its own branch page.

- `src/pages/index.astro` — homepage. Bio + directory into the branches. No stats, no feeds.
- `src/pages/work.astro` — capabilities, education, skills, resume download. Routed at `/work/`.
- `src/pages/cooking.astro` — Fife Spice + Recipes cards, Austin restaurants, `@fifespice` socials. Routed at `/cooking/`.
- `src/pages/writing.astro` — full Substack archive, fetched at build time. Routed at `/writing/`.
- `src/pages/concert-log.astro` — "Live Events": tabbed (Music / Stand-Up / Football) timeline + Leaflet map + stats, plus the "Currently Listening To" embed. Routed at `/concert-log/`.
- `src/pages/travel-log.astro` — map-first travel log, plus the "Snapshots" strip. Routed at `/travel-log/`. A sibling of concert-log; they share CSS variables, a CSV parser, person-avatars, and Leaflet setup.

The directory labels ("Travel", "Live") intentionally do **not** match their routes (`/travel-log/`, `/concert-log/`) — the URLs were kept to avoid breaking inbound links.

## Brand — "The Operator"

`brand-guide-standalone.html` at the repo root is the source of truth: burnt orange `#BF5700` on warm paper `#F6F4EF`; **Archivo** (display / UI / body), **Space Mono** (labels, data, numerals), **Newsreader** (long-form / editorial prose only). Voice is plain and specific — "147 live shows. 42 venues. Still counting." — never "A Curated Collection Of My Thoughts."

The four brand pages (`index`, `work`, `cooking`, `writing`) share `src/layouts/Base.astro`, which owns the tokens. Add a brand page by importing that layout; don't re-declare the tokens.

The two logs are **not** on that layout — they remain faithful ports whose `<style>` and app `<script>` are `is:inline`, emitted verbatim (no bundling, scoping, or minification). They now carry the **same brand tokens**, redeclared in each file's own `:root`, with back-compat aliases (`--gold` → `--orange`, `--card` → `--white`, …) so the ported CSS keeps working. **Editing a token means editing it in three places**: `Base.astro` and both logs. Deduping them into `src/lib` + `src/components` is still open follow-up work.

Additions to the logs should be written in *their* idiom — the Snapshots strip reuses travel-log's own `.gthumb` class and its global `openLightbox()` rather than shipping a second lightbox.

### Data-viz colour rules (both logs)

Categorical colour comes from a **fixed four-slot ramp**, declared as `--s1..--s4` in each log and validated with the `dataviz` skill's `validate_palette.js` against the paper surface (worst all-pairs CVD ΔE 14.4, every slot ≥ 3:1 contrast):

| Slot | Hex | Concert (state) | Travel (continent) |
|---|---|---|---|
| 1 | `#BF5700` | Texas | North America |
| 2 | `#009184` | Colorado | Europe |
| 3 | `#6257C4` | Wyoming | Caribbean |
| 4 | `#A32D5E` | Florida | Central America |
| — | `#9C968A` | Other | Other |

Rules, in order of how easy they are to break:

- **Colour follows the entity, never its rank.** Filtering must never repaint the survivors. Both logs key colour off a literal map (`STCOL`, `CONT_COLOR`), not an index.
- **Never generate a hue for a new category.** A fifth state or a country with no continent gets the neutral `Other` swatch — and `Other` must then appear in the legend. Travel deliberately colours by *continent*, not country: 20 countries is far past a readable legend.
- **Magnitude bars are one hue** (`--orange`), flat, with a 4px rounded data-end at the baseline. No gradients.
- `_colorFor()` in both logs generates an arbitrary hue for a person's initials circle. That is **identity, not a data encoding** — leave it alone; do not "fix" it into the series ramp.

Basemap is CARTO **Positron** (`light_all`). Markers carry a 2px `#F6F4EF` ring so overlapping circles stay separable. The travel-log lightbox stays **dark on purpose** — it's a photo viewer.

## /work — what it may and may not say

The page **names no employer.** Julian's current firm is described only as "a family office investing in public companies via structured debt and equity instruments." The resume at `public/resume.pdf` *does* name employers; that's intended — the goal is keeping company names out of indexable page text, not out of the resume.

It also links to, screenshots, and counts **none** of the internal tools he builds. Those live on his employer's infrastructure (see the separate `jules-tools` repo) and hold portfolio positions, filings, and NDA/over-the-wall data. A public **synthetic-data demo**, built from scrubbed copies, is planned as separate and carefully-scoped work. Until then `/work` describes the building capability in prose only. Don't add tool links here.

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
