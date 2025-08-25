import {
  Content,
  initFontAwesome,
} from '@bahmni-frontend/bahmni-design-system';
import {
  initAppI18n,
  initializeAuditListener,
} from '@bahmni-frontend/bahmni-services';
import {
  NotificationProvider,
  NotificationServiceComponent,
} from '@bahmni-frontend/bahmni-widgets';
import React, { useEffect, useState } from 'react';
import RegistrationRoutes from './RegistrationRoutes';

const RegistrationApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initAppI18n();
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
        <RegistrationRoutes />
      </NotificationProvider>
    </Content>
  );
};

export { RegistrationApp };
