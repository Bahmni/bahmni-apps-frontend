import React, { StrictMode } from 'react';
import * as ReactDOMModule from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { PUBLIC_PATH } from './constants/app';

// Extend Window interface for global React and ReactDOM
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactDOM: any;
  }
}

// Expose React and ReactDOM globally (needed by form2-controls helpers.js)
// This must be synchronous to avoid race conditions
window.React = React;
window.ReactDOM = ReactDOMModule;

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <BrowserRouter basename={PUBLIC_PATH ?? '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
