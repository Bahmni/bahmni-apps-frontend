import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { initAppI18n, initFontAwesome } from '@bahmni-frontend/bahmni-services';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

initAppI18n();
initFontAwesome();

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
