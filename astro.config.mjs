// @ts-check
import { defineConfig } from 'astro/config';

// Static site served from GitHub Pages at the apex custom domain (see public/CNAME).
// Default output is 'static' — every page is pre-rendered to HTML at build time.
export default defineConfig({
  site: 'https://julianfife.com',
});
