import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the same build works at a domain root and from a
  // GitHub Pages project subpath.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  // The parent app ships a PostCSS + Tailwind v3 config. Vite walks up looking
  // for one, so opt out explicitly and let @tailwindcss/vite own the pipeline.
  css: { postcss: { plugins: [] } },
  server: { port: 5180 },
  preview: { port: 5180 },
});
