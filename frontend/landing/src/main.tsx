import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/readex-pro';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './index.css';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
