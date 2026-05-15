import { initFontAwesome, Loading } from '@bahmni/design-system';
import { initAppI18n } from '@bahmni/services';
import React, { useEffect, useState } from 'react';
import { HomePage } from './components/HomePage';
import { HOME_NAMESPACE } from './constants/app';

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

  return <HomePage />;
};

export { HomeApp };
