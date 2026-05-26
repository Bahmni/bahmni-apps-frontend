import { initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n } from '@bahmni/services';
import {
  ActivePractitionerProvider,
  LocationProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { HOME_NAMESPACE } from './constants/app';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(HOME_NAMESPACE);
        initFontAwesome();
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
    <QueryClientProvider client={queryClient}>
      <ActivePractitionerProvider>
        <UserPrivilegeProvider>
          <NotificationProvider>
            <LocationProvider>
              <NotificationServiceComponent />
              <Suspense fallback={<Loading />}>
                <Routes>{renderRoutes(routes)}</Routes>
              </Suspense>
              <ReactQueryDevtools initialIsOpen={false} />
            </LocationProvider>
          </NotificationProvider>
        </UserPrivilegeProvider>
      </ActivePractitionerProvider>
    </QueryClientProvider>
  );
}

export default App;
