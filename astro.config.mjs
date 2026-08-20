// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';

// Vite only inlines PUBLIC_* vars present at build time. Cloudflare Pages
// does not load .env.local, so production builds need this default.
process.env.PUBLIC_CONVEX_URL ||= "https://clean-clownfish-658.convex.cloud";

const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  output: 'server',
  trailingSlash: 'always',
  session: false,
  adapter: isDev
    ? node({ mode: 'standalone' })
    : cloudflare({
        imageService: 'passthrough',
      }),
  integrations: [react()],
});
