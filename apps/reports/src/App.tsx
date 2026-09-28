import { Content, Loading, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  ActivePractitionerProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserActionProvider,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { PrivilegeGuard } from './components/PrivilegeGuard/PrivilegeGuard';
import { queryClientConfig } from './config/tanstackQuery';
import { BAHMNI_REPORTS_NAMESPACE } from './constants/app';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(BAHMNI_REPORTS_NAMESPACE);
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
          <UserPrivilegeProvider>
            <ActivePractitionerProvider>
              <UserActionProvider>
                <NotificationServiceComponent />
                <PrivilegeGuard>
                  <Suspense fallback={<Loading />}>
                    <Routes>{renderRoutes(routes)}</Routes>
                  </Suspense>
                </PrivilegeGuard>
                <ReactQueryDevtools initialIsOpen={false} />
              </UserActionProvider>
            </ActivePractitionerProvider>
          </UserPrivilegeProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </Content>
  );
}

export default App;
