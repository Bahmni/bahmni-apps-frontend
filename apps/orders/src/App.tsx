import { Content, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { queryClientConfig } from './config/tanstackQuery';
import { ORDERS_NAMESPACE } from './constants/app';
import { OrdersPage } from './pages/OrdersPage';
import { OrdersConfigProvider } from './providers/OrdersConfigProvider';

const queryClient = new QueryClient(queryClientConfig);
const OrdersApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(ORDERS_NAMESPACE);
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
    return <div>Loading...</div>;
  }
  return (
    <Content>
      <NotificationProvider>
        <NotificationServiceComponent />
        <QueryClientProvider client={queryClient}>
          <OrdersConfigProvider>
            <UserPrivilegeProvider>
              <Routes>
                <Route path="/search" element={<OrdersPage />} />
              </Routes>
              <ReactQueryDevtools initialIsOpen={false} />
            </UserPrivilegeProvider>
          </OrdersConfigProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </Content>
  );
};
export { OrdersApp };
