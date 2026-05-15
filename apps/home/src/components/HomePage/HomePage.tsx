import {
  ActivePractitionerProvider,
  LocationProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { HomePageGrid } from '../HomePageGrid';
import { HomePageHeader } from '../HomePageHeader';
import styles from './styles/HomePage.module.scss';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export const HomePage: React.FC = () => (
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
