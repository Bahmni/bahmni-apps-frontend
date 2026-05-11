import {
  ActivePractitionerProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { HomePageGrid } from './components/HomePageGrid';
import { HomePageHeader } from './components/HomePageHeader';
import { LocationProvider } from './context';
import styles from './styles/IndexPage.module.scss';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export const IndexPage: React.FC = () => {
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
