import { Content, Loading, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n } from '@bahmni/services';
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
import styles from './App.module.scss';
import { PrivilegeGuard } from './components/PrivilegeGuard';
import { queryClientConfig } from './config/tanstackQuery';
import { BAHMNI_ADMIN_NAMESPACE } from './constants/app';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(BAHMNI_ADMIN_NAMESPACE);
        initFontAwesome();
        setIsInitialized(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    void initializeApp();
  }, []);

  if (!isInitialized) {
    return <Loading />;
  }
  return (
    <Content className={styles.content}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <UserPrivilegeProvider>
            <ActivePractitionerProvider>
              <UserActionProvider>
                <NotificationServiceComponent />
                <Suspense fallback={<Loading />}>
                  <PrivilegeGuard>
                    <Routes>{renderRoutes(routes)}</Routes>
                  </PrivilegeGuard>
                </Suspense>
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
