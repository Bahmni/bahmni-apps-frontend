import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const publicPath = process.env.PUBLIC_URL ?? '/';
    navigator.serviceWorker
      .register(`${publicPath}service-worker.js`)
      .catch(() => {});
  });
}

root.render(
  <StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL ?? '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
