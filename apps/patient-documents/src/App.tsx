import { Content, Loading, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  ActivePractitionerProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { BAHMNI_PATIENT_DOCUMENTS_NAMESPACE } from './constants/app';
import { PatientDocumentsConfigProvider } from './providers/patientDocumentsConfig';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
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
    return <Loading />;
  }
  return (
    <Content>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <NotificationServiceComponent />
          <PatientDocumentsConfigProvider>
            <UserPrivilegeProvider>
              <ActivePractitionerProvider>
                <Suspense fallback={<Loading />}>
                  <Routes>{renderRoutes(routes)}</Routes>
                </Suspense>
                <ReactQueryDevtools initialIsOpen={false} />
              </ActivePractitionerProvider>
            </UserPrivilegeProvider>
          </PatientDocumentsConfigProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </Content>
  );
}

export default App;
