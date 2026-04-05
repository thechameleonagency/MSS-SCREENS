import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppVersionBlocker } from './components/AppVersionBlocker';
import { AppProviders } from './contexts/AppProviders';
import {
  APP_VERSION,
  APP_VERSION_STORAGE_KEY,
  shouldBlockOnVersionMismatch,
} from './lib/appVersion';
import { ensureSeed } from './lib/seedData';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root')!;

if (shouldBlockOnVersionMismatch()) {
  createRoot(rootEl).render(
    <StrictMode>
      <AppVersionBlocker />
    </StrictMode>
  );
} else {
  ensureSeed();
  localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);

  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </StrictMode>
  );
}
