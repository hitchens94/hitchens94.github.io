// @ts-check
import { defineConfig } from 'astro/config';

// Static site served from GitHub Pages at the apex custom domain (see public/CNAME).
// Default output is 'static' — every page is pre-rendered to HTML at build time.
export default defineConfig({
  site: 'https://julianfife.com',
  // Backward-compat for the old /concert-log.html and /travel-log.html URLs is
  // handled by exact static redirect files in public/ (so the precise old paths
  // resolve directly), not by config redirects (which emit directory-style
  // name.html/index.html and rely on a Pages trailing-slash hop).
});
