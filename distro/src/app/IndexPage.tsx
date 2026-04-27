import {
  ActivePractitionerProvider,
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import React from 'react';
import { HomePageGrid } from './components/HomePageGrid';
import { HomePageHeader } from './components/HomePageHeader';

export const IndexPage: React.FC = () => {
  return (
    <ActivePractitionerProvider>
      <UserPrivilegeProvider>
        <NotificationProvider>
          <NotificationServiceComponent />
          <HomePageHeader />
          <main>
            <HomePageGrid />
          </main>
        </NotificationProvider>
      </UserPrivilegeProvider>
    </ActivePractitionerProvider>
  );
};
