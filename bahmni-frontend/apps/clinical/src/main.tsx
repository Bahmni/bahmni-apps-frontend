import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import '@carbon/styles/css/styles.css';

import App from './app/app';
import { initAppI18n } from '@bahmni-frontend/bahmni-services';
import { initFontAwesome } from '@bahmni-frontend/bahmni-design-system';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

const initializeApp = async () => {
  await initAppI18n();
  initFontAwesome();

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

initializeApp();
