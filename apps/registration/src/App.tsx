import { CommandPaletteProvider } from '@bahmni/command-palette-app';
import { Content, initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
  UserActionProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { REGISTRATION_NAMESPACE } from './constants/app';
import { PersonAttributesProvider } from './providers/PersonAttributesProvider';
import { RegistrationConfigProvider } from './providers/registrationConfig';
import { renderRoutes, routes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

const RegistrationApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(REGISTRATION_NAMESPACE);
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
      <NotificationProvider>
        <NotificationServiceComponent />
        <QueryClientProvider client={queryClient}>
          <RegistrationConfigProvider>
            <PersonAttributesProvider>
              <UserPrivilegeProvider>
                <UserActionProvider>
                  <CommandPaletteProvider>
                    <Suspense fallback={<Loading />}>
                      <Routes>{renderRoutes(routes)}</Routes>
                    </Suspense>
                  </CommandPaletteProvider>
                </UserActionProvider>
              </UserPrivilegeProvider>
            </PersonAttributesProvider>
          </RegistrationConfigProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};

export { RegistrationApp };
