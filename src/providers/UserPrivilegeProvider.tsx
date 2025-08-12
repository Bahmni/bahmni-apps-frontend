import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { UserPrivilegeContext } from '@contexts/UserPrivilegeContext';
import notificationService from '@services/notificationService';
import { getCurrentUserPrivileges } from '@services/privilegeService';
import { getFormattedError } from '@utils/common';
import { UserPrivilege } from '@utils/privilegeUtils';

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
