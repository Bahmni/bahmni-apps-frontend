import { CommandPaletteProvider } from '@bahmni/command-palette-app';
import { Content, initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
  ActivePractitionerProvider,
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
    let hasEffectUnmounted = false;
    let removeAuditListener: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        await initAppI18n(REGISTRATION_NAMESPACE);
        initFontAwesome();
        const cleanup = initializeAuditListener();
        if (hasEffectUnmounted) {
          cleanup?.();
        } else {
          removeAuditListener = cleanup;
        }
        setIsInitialized(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();

    return () => {
      hasEffectUnmounted = true;
      removeAuditListener?.();
    };
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
                <ActivePractitionerProvider>
                  <UserActionProvider>
                    <CommandPaletteProvider>
                      <Suspense fallback={<Loading />}>
                        <Routes>{renderRoutes(routes)}</Routes>
                      </Suspense>
                    </CommandPaletteProvider>
                  </UserActionProvider>
                </ActivePractitionerProvider>
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
