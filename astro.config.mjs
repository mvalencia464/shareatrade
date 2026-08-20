// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// Vite only inlines PUBLIC_* vars present at build time. Cloudflare Pages
// does not load .env.local, so production builds need this default.
process.env.PUBLIC_CONVEX_URL ||= "https://clean-clownfish-658.convex.cloud";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
});
