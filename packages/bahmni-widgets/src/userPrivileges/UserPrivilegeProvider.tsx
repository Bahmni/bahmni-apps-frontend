import {
  notificationService,
  getFormattedError,
  getCurrentUserPrivileges,
  LOGIN_PATH,
  type UserPrivilege,
} from '@bahmni/services';
import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { UserPrivilegeContext } from './UserPrivilegeContext';

interface UserPrivilegeProviderProps {
  children: ReactNode;
}

export const UserPrivilegeProvider: React.FC<UserPrivilegeProviderProps> = ({
  children,
}) => {
  const [userPrivileges, setUserPrivileges] = useState<UserPrivilege[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserPrivileges = async () => {
      setIsLoading(true);
      try {
        const privileges = await getCurrentUserPrivileges();
        if (privileges === null) {
          globalThis.location.href = LOGIN_PATH;
          return;
        }
        setUserPrivileges(privileges);
      } catch (error) {
        const { title, message } = getFormattedError(error);
        setError(new Error(message));
        notificationService.showError(title, message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPrivileges();
  }, []);

  const value = useMemo(
    () => ({
      userPrivileges,
      setUserPrivileges,
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [userPrivileges, isLoading, error],
  );

  return (
    <UserPrivilegeContext.Provider value={value}>
      {children}
    </UserPrivilegeContext.Provider>
  );
};

UserPrivilegeProvider.displayName = 'UserPrivilegeProvider';
