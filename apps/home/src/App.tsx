import { initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n } from '@bahmni/services';
import {
  ActivePractitionerProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { HomePageGrid } from './components/HomePageGrid';
import { HomePageHeader } from './components/HomePageHeader';
import { HOME_NAMESPACE } from './constants/app';
import { LocationProvider } from './context';
import styles from './styles/IndexPage.module.scss';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const HomeApp: React.FC = () => {
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
    <LocationProvider>
      <QueryClientProvider client={queryClient}>
        <ActivePractitionerProvider>
          <UserPrivilegeProvider>
            <NotificationProvider>
              <NotificationServiceComponent />
              <HomePageHeader />
              <main className={styles.homePageBody}>
                <HomePageGrid />
              </main>
            </NotificationProvider>
          </UserPrivilegeProvider>
        </ActivePractitionerProvider>
      </QueryClientProvider>
    </LocationProvider>
  );
};

export { HomeApp };
