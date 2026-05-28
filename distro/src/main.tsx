import {
  initFontAwesome,
  applyBahmniTheme,
  BAHMNI_DEFAULT_THEME,
} from '@bahmni/design-system';
import '@bahmni/widgets/styles';
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

// Migration cleanup: unregister any service workers left over from the bahmni-new/ path.
// Remove this block once it's safe to assume all active users have cycled through the new path.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// Migration cleanup: redirect old Angular clinical hash URLs to React equivalent.
// e.g. /bahmni/clinical/#/default/patient/uuid/dashboard → /bahmni/clinical/uuid
// Remove once all clients have migrated away from old Angular clinical URLs.
function redirectLegacyClinicalUrl() {
  const UUID_PATTERN =
    /^#\/[^/]+\/patient\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})/i;
  if (!window.location.pathname.includes('/clinical')) return;
  const match = window.location.hash.match(UUID_PATTERN);
  if (match) window.location.replace(`${PUBLIC_PATH}clinical/${match[1]}`);
}
redirectLegacyClinicalUrl();

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
