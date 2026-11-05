import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk/wght.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import 'lenis/dist/lenis.css';
import './styles/index.css';
import App from './App';

const root = createRoot(document.getElementById('root')!);

if (new URLSearchParams(window.location.search).has('render')) {
  // Frame-export mode for scripts/render-hero-frames.mjs (no StrictMode: one scene, one canvas).
  const RenderMode = lazy(() => import('./hero/RenderMode'));
  root.render(
    <Suspense fallback={null}>
      <RenderMode />
    </Suspense>,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
