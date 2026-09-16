import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [tailwind()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
});
