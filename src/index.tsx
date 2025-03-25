import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from '@providers/NotificationProvider';
import { NotificationServiceComponent } from './services/NotificationServiceComponent';
import './styles/index.scss';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use a relative path that will work regardless of the base URL
    const swUrl = new URL('./service-worker.js', window.location.href).pathname;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.error('SW registration failed: ', registrationError);
      });
  });
}

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
