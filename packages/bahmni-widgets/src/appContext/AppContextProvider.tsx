import {
  getDefaultDateFormat,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import React, { ReactNode, useEffect } from 'react';

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    getDefaultDateFormat()
      .then((dateFormat) => {
        dateFormat &&
          localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, dateFormat);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load default date format:', error);
      });
  }, []);

  return <>{children}</>;
};

AppContextProvider.displayName = 'AppContextProvider';
