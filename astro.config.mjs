// @ts-check
import { defineConfig } from 'astro/config';

// For GitHub Pages project sites the URL is https://<user>.github.io/<repo>/
// so `base` must be the repository name. If you rename the repo, or move to a
// custom domain, update both values below (and `base: '/'` for a custom domain).
export default defineConfig({
  site: 'https://geojenks.github.io',
  base: '/allotment',
});
