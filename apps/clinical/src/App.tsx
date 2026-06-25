import { CommandPaletteProvider } from '@bahmni/command-palette-app';
import { Content, initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
  ActivePractitionerProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { Suspense, useEffect, useState } from 'react';
import { Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { CLINICAL_NAMESPACE } from './constants/app';
import { ClinicalConfigProvider } from './providers/clinicalConfig';
import { routes, renderRoutes } from './routes';

const queryClient = new QueryClient(queryClientConfig);

const ClinicalApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(CLINICAL_NAMESPACE);
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
          <ClinicalConfigProvider>
            <UserPrivilegeProvider>
              <ActivePractitionerProvider>
                <CommandPaletteProvider>
                  <Suspense fallback={<Loading />}>
                    <Routes>{renderRoutes(routes)}</Routes>
                  </Suspense>
                  <ReactQueryDevtools initialIsOpen={false} />
                </CommandPaletteProvider>
              </ActivePractitionerProvider>
            </UserPrivilegeProvider>
          </ClinicalConfigProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};

export { ClinicalApp };
