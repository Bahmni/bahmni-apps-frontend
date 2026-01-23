import { Content, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
  ActivePractitionerProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { CLINICAL_NAMESPACE } from './constants/app';
import ConsultationPage from './pages/ConsultationPage';
import { ClinicalConfigProvider } from './providers/ClinicalConfigProvider';

const queryClient = new QueryClient(queryClientConfig);

const ClinicalApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(CLINICAL_NAMESPACE);
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
          <ClinicalConfigProvider>
            <UserPrivilegeProvider>
              <ActivePractitionerProvider>
                <Routes>
                  <Route path=":patientUuid" element={<ConsultationPage />} />
                </Routes>
                <ReactQueryDevtools initialIsOpen={false} />
              </ActivePractitionerProvider>
            </UserPrivilegeProvider>
          </ClinicalConfigProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};

export { ClinicalApp };
