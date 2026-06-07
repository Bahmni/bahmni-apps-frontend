import {
  initFontAwesome,
  applyBahmniTheme,
  BAHMNI_DEFAULT_THEME,
} from '@bahmni/design-system';
import * as DesignSystem from '@bahmni/design-system';
import '@bahmni/widgets/styles';
import * as Widgets from '@bahmni/widgets';
import React, { StrictMode } from 'react';
import * as ReactDOMModule from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as ReactQuery from '@tanstack/react-query';
import * as ReactI18next from 'react-i18next';
import * as JSXRuntime from 'react/jsx-runtime';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { PUBLIC_PATH } from './constants/app';
import { CuratedServices } from './controlsSdk';
import type { BahmniControlsSdk } from '@bahmni/widgets';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactDOM: any;
    BahmniControls: BahmniControlsSdk;
  }
}

// Required by form2-controls helpers.js — must be synchronous
window.React = React;
window.ReactDOM = ReactDOMModule;

// SDK global for external custom controls — must run synchronously before any control loads
window.BahmniControls = Object.freeze({
  React,
  ReactDOM: ReactDOMModule,
  jsxRuntime: JSXRuntime,
  reactQuery: ReactQuery,
  reactI18next: ReactI18next,
  designSystem: DesignSystem,
  services: CuratedServices,
  widgets: Widgets,
});

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
