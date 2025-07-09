import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '@providers/NotificationProvider';
import { NotificationServiceComponent } from '@services/NotificationServiceComponent';
import App from './App';
import { initFontAwesome } from './fontawesome';
import '@styles/index.scss';
import '@/i18n';

// Initialize FontAwesome
initFontAwesome();

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      <NotificationProvider>
        <NotificationServiceComponent />
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
