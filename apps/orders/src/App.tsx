import { Content, initFontAwesome } from '@bahmni/design-system';
import { initAppI18n, initializeAuditListener } from '@bahmni/services';
import {
  NotificationProvider,
  NotificationServiceComponent,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ORDERS_NAMESPACE } from './constants/app';
import { OrdersPage } from './pages/OrdersPage';
import { OrdersConfigProvider } from './providers/OrdersConfigProvider';
import useOrdersStore from './stores/ordersStore';

const OrdersApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchCurrentUser, setCurrentLocation } = useOrdersStore();
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n(ORDERS_NAMESPACE);
        initFontAwesome();
        initializeAuditListener();
        setIsInitialized(true);
        fetchCurrentUser();
        setCurrentLocation();
        document.title = 'Orders';
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
        <OrdersConfigProvider>
          <UserPrivilegeProvider>
            <Routes>
              <Route path="/search" element={<OrdersPage />} />
            </Routes>
          </UserPrivilegeProvider>
        </OrdersConfigProvider>
      </NotificationProvider>
    </Content>
  );
};
export { OrdersApp };
