import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import App from './App.tsx';
import { ConfirmProvider } from './components/ConfirmDialog.tsx';
import { loadEngine } from './pdf/engine';
import './index.css';

// Start fetching the PDF engine and fonts right away, in parallel with the first render.
loadEngine().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </StrictMode>
);
