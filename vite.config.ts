import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Where the site is served from. "/" locally; GitHub Pages serves project
 * sites from "/<repository>/", which the deploy workflow passes as BASE_PATH.
 */
const base = process.env.BASE_PATH || '/';

/**
 * Preloads the two Latin variable fonts used above the fold. Vite emits the
 * font files with hashed names, so the tags are injected from the bundle.
 */
function preloadCriticalFonts(): Plugin {
  const critical = [/space-grotesk-latin-wght-normal/, /inter-latin-wght-normal/];
  return {
    name: 'sensan:preload-fonts',
    apply: 'build',
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return [];
      return Object.keys(ctx.bundle)
        .filter((file) => file.endsWith('.woff2') && critical.some((re) => re.test(file)))
        .map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${base}${file}`, crossorigin: '' },
          injectTo: 'head' as const,
        }));
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), preloadCriticalFonts()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
    // The Three.js scene is one lazy chunk (~155 kB gzipped) loaded only on WebGL devices.
    chunkSizeWarningLimit: 650,
  },
});
