import {
  initFontAwesome,
  applyBahmniTheme,
  BAHMNI_DEFAULT_THEME,
} from '@bahmni/design-system';
import '@bahmni/widgets/styles';
import { installControlsSdk } from '@bahmni/widgets';
import React, { StrictMode } from 'react';
import * as ReactDOMModule from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { PUBLIC_PATH } from './constants/app';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactDOM: any;
  }
}

// Required by form2-controls helpers.js — must be synchronous
window.React = React;
window.ReactDOM = ReactDOMModule;

// Expose host SDK singletons for external custom controls — synchronous, before any control loads
installControlsSdk(window);

applyBahmniTheme(BAHMNI_DEFAULT_THEME);
initFontAwesome();

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <BrowserRouter basename={PUBLIC_PATH ?? '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
