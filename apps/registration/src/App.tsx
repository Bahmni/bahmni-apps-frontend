import {
  Content,
  initFontAwesome,
} from '@bahmni-frontend/bahmni-design-system';
import {
  initAppI18n,
  initializeAuditListener,
} from '@bahmni-frontend/bahmni-services';
import {
  NotificationProvider,
  NotificationServiceComponent,
} from '@bahmni-frontend/bahmni-widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import CreatePatient from './pages/createPatientPage';
import PatientSearchPage from './pages/patientSearchPage';

const queryClient = new QueryClient(queryClientConfig);

const RegistrationApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n();
        initFontAwesome();
        initializeAuditListener();
        setIsInitialized(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Content>
      <NotificationProvider>
        <NotificationServiceComponent />
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/search" element={<PatientSearchPage />} />
            <Route path="/new" element={<CreatePatient />} />
          </Routes>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};

export { RegistrationApp };
