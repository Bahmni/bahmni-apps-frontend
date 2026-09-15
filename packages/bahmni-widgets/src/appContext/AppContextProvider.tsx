import {
  getDefaultDateFormat,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
  validateSessionUser,
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

  // Nothing pushes a session change to the browser, so the OpenMRS session
  // user can only be re-checked when Bahmni next gets the chance. Returning to
  // the tab is that moment: the user has been away, which is exactly when they
  // could have logged into OpenMRS as somebody else. Checking as the tab is
  // hidden instead would be too early — the user has not left yet, so any
  // mismatch has not been created.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      validateSessionUser().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to validate the session user:', error);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return <>{children}</>;
};

AppContextProvider.displayName = 'AppContextProvider';
