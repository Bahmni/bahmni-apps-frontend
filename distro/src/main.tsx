import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { PUBLIC_PATH } from './constants/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const publicPath = PUBLIC_PATH ?? '/';
    navigator.serviceWorker
      .register(`${publicPath}service-worker.js`)
      .catch(() => {});
  });
}

root.render(
  <StrictMode>
    <BrowserRouter basename={PUBLIC_PATH ?? '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
